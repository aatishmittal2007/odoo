import React from 'react';
import { AlertTriangle, CheckCircle, PackageOpen, Truck, Calendar } from 'lucide-react';
import { Badge } from '../common/Badge';

interface ImpactedOrder {
  orderId: string;
  orderNumber: string;
  customer: string;
  requiredQuantity: number;
  scheduledDate: string;
  status: 'AT_RISK' | 'CRITICAL_SHORTAGE' | 'NORMAL';
  riskReason: string;
}

interface BusinessImpactProps {
  impact: {
    hasImpact: boolean;
    message: string;
    affectedOrdersCount: number;
    potentialShortageUnits: number;
    orders: ImpactedOrder[];
    summary: {
      totalCommittedDemand: number;
      availablePhysicalStock: number;
      shortfall: number;
    };
  };
  productUom?: string;
}

export const BusinessImpact: React.FC<BusinessImpactProps> = ({ impact, productUom = 'units' }) => {
  if (!impact || !impact.hasImpact) {
    return (
      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
            Operational Downstream Impact
          </h4>
          <p className="text-xs text-emerald-800 mt-0.5">
            {impact?.message || 'No active business impact detected. All active orders are covered by physical stock.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-4">
      {/* Header Alert */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
              Critical Business & Downstream Order Impact
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">{impact.message}</p>
          </div>
        </div>

        {/* Shortage Metric Pill */}
        <div className="px-3 py-1.5 bg-amber-100/90 border border-amber-300 rounded-lg text-right shrink-0">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-800">
            Potential Shortage
          </span>
          <span className="text-base font-bold font-mono text-amber-950">
            {impact.potentialShortageUnits} {productUom}
          </span>
        </div>
      </div>

      {/* Demand & Physical Balance Comparison Bar */}
      <div className="grid grid-cols-3 gap-2.5 pt-1 text-center">
        <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Physical Available</span>
          <span className="text-sm font-bold font-mono text-slate-800">
            {impact.summary.availablePhysicalStock} {productUom}
          </span>
        </div>
        <div className="bg-white/80 p-2.5 rounded-lg border border-amber-200/60">
          <span className="block text-[10px] uppercase font-bold text-slate-400">Total Active Demand</span>
          <span className="text-sm font-bold font-mono text-slate-800">
            {impact.summary.totalCommittedDemand} {productUom}
          </span>
        </div>
        <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200">
          <span className="block text-[10px] uppercase font-bold text-rose-500">Uncovered Shortfall</span>
          <span className="text-sm font-bold font-mono text-rose-700">
            {impact.summary.shortfall} {productUom}
          </span>
        </div>
      </div>

      {/* Affected Delivery Orders List */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
          Affected Customer Orders ({impact.orders.length})
        </span>
        <div className="space-y-2">
          {impact.orders.map((order) => {
            const isAtRisk = order.status !== 'NORMAL';

            return (
              <div
                key={order.orderId}
                className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs transition-colors ${
                  isAtRisk ? 'bg-white border-amber-200 shadow-2xs' : 'bg-slate-50/50 border-slate-200 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isAtRisk ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 font-mono">{order.orderNumber}</span>
                      <span className="text-slate-700 font-medium">• {order.customer}</span>
                    </div>
                    <p className="text-[11px] text-amber-800/90 mt-0.5">{order.riskReason}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="block font-mono font-bold text-slate-900">
                      Req: {order.requiredQuantity} {productUom}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 justify-end">
                      <Calendar className="w-3 h-3" />
                      {new Date(order.scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <Badge variant={order.status === 'CRITICAL_SHORTAGE' ? 'critical' : isAtRisk ? 'high' : 'resolved'}>
                    {order.status === 'CRITICAL_SHORTAGE' ? 'CRITICAL SHORTAGE' : isAtRisk ? 'AT RISK' : 'COVERED'}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
