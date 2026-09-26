import prisma from '../../prisma';
import { AuditService } from '../audit.service';

export interface N8nEventPayload {
  event: string;
  eventId: string;
  timestamp: string;
  data: any;
}

export class N8nService {
  private static getWebhookUrl(): string {
    return process.env.N8N_WEBHOOK_URL || 'http://n8n:5678/webhook/stocksense';
  }

  private static getWebhookSecret(): string {
    return process.env.N8N_WEBHOOK_SECRET || process.env.N8N_API_KEY || 'stocksense-n8n-webhook-secret-2026';
  }

  /**
   * Health status check for n8n automation engine
   */
  public static async checkStatus(): Promise<{ status: 'connected' | 'unavailable'; message: string; url: string }> {
    const baseUrl = process.env.N8N_HOST ? `http://${process.env.N8N_HOST}:${process.env.N8N_PORT || 5678}` : 'http://localhost:5678';

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(`${baseUrl}/healthz`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        return {
          status: 'connected',
          message: 'n8n automation engine is healthy and responding',
          url: baseUrl,
        };
      } else {
        return {
          status: 'unavailable',
          message: `n8n returned status ${res.status}`,
          url: baseUrl,
        };
      }
    } catch (err: any) {
      return {
        status: 'unavailable',
        message: 'n8n is currently offline or unreachable. Core inventory functions unaffected.',
        url: baseUrl,
      };
    }
  }

  /**
   * Dispatches an event to n8n asynchronously.
   * Completely decoupled and non-blocking: never throws an error that could fail a core inventory transaction.
   * Persists event state in the AutomationEvent table for full observability.
   */
  public static async dispatchEvent(event: string, data: any): Promise<void> {
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload: N8nEventPayload = {
      event,
      eventId,
      timestamp: new Date().toISOString(),
      data,
    };

    // Persist the event immediately as PENDING for observability
    try {
      await prisma.automationEvent.create({
        data: {
          eventId,
          eventType: event,
          entityType: data?.entityType || event.split('.')[0],
          entityId: data?.exceptionId || data?.entityId || data?.id || eventId,
          payload: JSON.stringify(payload),
          status: 'PENDING',
        },
      });
    } catch (dbErr: any) {
      // Non-blocking: if DB write fails, continue with dispatch attempt
      console.warn(`[N8nService] Failed to persist AutomationEvent ${eventId}: ${dbErr.message}`);
    }

    // Run dispatch asynchronously in background with retry backoff
    this.sendWithRetry(payload, eventId, 2).catch((err) => {
      console.warn(`[N8nService] Non-blocking event dispatch failed for ${event} (${eventId}): ${err.message}`);
    });
  }

  private static async sendWithRetry(payload: N8nEventPayload, dbEventId: string, retriesLeft: number): Promise<void> {
    const url = `${this.getWebhookUrl()}/${payload.event.replace('.', '-')}`;
    const secret = this.getWebhookSecret();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-stocksense-webhook-secret': secret,
          'X-Event-ID': payload.eventId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok && retriesLeft > 0) {
        await new Promise((r) => setTimeout(r, 1000));
        return this.sendWithRetry(payload, dbEventId, retriesLeft - 1);
      }

      if (response.ok) {
        // Update AutomationEvent to SENT
        await prisma.automationEvent.updateMany({
          where: { eventId: payload.eventId },
          data: { status: 'SENT', processedAt: new Date() },
        }).catch(() => {});

        await AuditService.log({
          action: 'N8N_EVENT_DISPATCHED',
          entity: 'AutomationEvent',
          entityId: payload.eventId,
          metadata: { event: payload.event, status: response.status },
        }).catch(() => {});
      } else {
        // Update to FAILED after exhausting retries
        await prisma.automationEvent.updateMany({
          where: { eventId: payload.eventId },
          data: {
            status: 'FAILED',
            errorMessage: `HTTP ${response.status} - ${response.statusText}`,
            retryCount: 2 - retriesLeft,
          },
        }).catch(() => {});
      }
    } catch (err: any) {
      if (retriesLeft > 0) {
        await new Promise((r) => setTimeout(r, 1500));
        return this.sendWithRetry(payload, dbEventId, retriesLeft - 1);
      }

      // Update AutomationEvent to FAILED
      await prisma.automationEvent.updateMany({
        where: { eventId: payload.eventId },
        data: {
          status: 'FAILED',
          errorMessage: err.message,
          retryCount: 2,
        },
      }).catch(() => {});

      // Non-blocking log to AuditLog for observability
      await AuditService.log({
        action: 'N8N_EVENT_FAILED',
        entity: 'AutomationEvent',
        entityId: payload.eventId,
        metadata: { event: payload.event, error: err.message },
      }).catch(() => {});
    }
  }

  /**
   * Handle incoming callback from n8n workflows.
   * Validates webhook secret before processing.
   */
  public static async handleCallback(secretHeader: string | undefined, body: any): Promise<any> {
    const expectedSecret = this.getWebhookSecret();
    if (!secretHeader || secretHeader !== expectedSecret) {
      throw new Error('Unauthorized n8n webhook callback: secret mismatch');
    }

    const { action, exceptionId, taskData, aiAnalysis } = body;

    if (action === 'STORE_AI_ANALYSIS' && exceptionId && aiAnalysis) {
      await prisma.aIAnalysis.upsert({
        where: { exceptionId },
        create: {
          exceptionId,
          summary: aiAnalysis.summary || 'Summary generated via n8n automation',
          factsJson: JSON.stringify(aiAnalysis.facts || []),
          potentialCausesJson: JSON.stringify(aiAnalysis.potential_causes || []),
          recommendedChecksJson: JSON.stringify(aiAnalysis.recommended_checks || []),
          modelUsed: aiAnalysis.modelUsed || 'n8n-workflow-pipeline',
          confidence: aiAnalysis.confidence || 'ASSISTED',
        },
        update: {
          summary: aiAnalysis.summary || 'Summary generated via n8n automation',
          factsJson: JSON.stringify(aiAnalysis.facts || []),
          potentialCausesJson: JSON.stringify(aiAnalysis.potential_causes || []),
          recommendedChecksJson: JSON.stringify(aiAnalysis.recommended_checks || []),
          modelUsed: aiAnalysis.modelUsed || 'n8n-workflow-pipeline',
          confidence: aiAnalysis.confidence || 'ASSISTED',
        },
      });

      return { success: true, message: 'AI Analysis stored successfully' };
    }

    if (action === 'CREATE_ESCALATION_TASK' && exceptionId && taskData) {
      const task = await prisma.investigationTask.create({
        data: {
          exceptionId,
          title: taskData.title || 'Urgent: High Severity Exception Review',
          description: taskData.description || 'Auto-created by n8n high-severity workflow rule',
          dueDate: taskData.dueDate ? new Date(taskData.dueDate) : new Date(Date.now() + 86400000),
          status: 'TODO',
        },
      });

      await AuditService.log({
        action: 'TASK_CREATED',
        entity: 'InvestigationTask',
        entityId: task.id,
        metadata: { triggeredBy: 'n8n_escalation_workflow', exceptionId },
      });

      return { success: true, task };
    }

    return { success: true, message: 'Callback received and acknowledged' };
  }
}
