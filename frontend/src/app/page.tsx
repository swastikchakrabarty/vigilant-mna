"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, DollarSign, PieChart, TrendingUp, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const [buyer, setBuyer] = useState({
    name: "Buyer Corp",
    share_price: 150.0,
    shares_outstanding: 50.0,
    net_income: 450.0,
    tax_rate: 0.21,
  });

  const [target, setTarget] = useState({
    name: "Target Inc.",
    share_price: 35.0,
    shares_outstanding: 25.0,
    net_income: 45.0,
    tax_rate: 0.21,
  });

  const [deal, setDeal] = useState({
    offer_price_per_share: 45.0,
    percent_cash: 0.5,
    percent_stock: 0.5,
    cost_of_debt: 0.06,
    yield_on_cash: 0.02,
    pre_tax_synergies: 25.0,
    transaction_fees_percent: 0.02,
  });

  const [metrics, setMetrics] = useState<any>(null);
  const [sensitivities, setSensitivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const premium = ((deal.offer_price_per_share / target.share_price) - 1.0) * 100;

  useEffect(() => {
    fetch("https://mna-backend.onrender.com")
      .then(res => res.json())
      .then(data => {
        if (data.message === "Backend Active") console.log("Backend Connected");
      })
      .catch(() => setError("Backend Connection Failed: Is the FastAPI server running on port 8000?"));
  }, []);

  useEffect(() => {
    async function fetchAnalysis() {
      setLoading(true);
      setError("");
      try {
        const payload = { buyer, target, deal };
        const res = await fetch("https://mna-backend.onrender.com/calculate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const e = await res.json();
          throw new Error(e.detail || "Analysis failed");
        }
        const data = await res.json();
        setMetrics(data.metrics);
        setSensitivities(data.sensitivities);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    // Debounce slightly to prevent spamming the rigorous backend math
    const timeoutId = setTimeout(() => {
      fetchAnalysis();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [buyer, target, deal]);

  const handleMixChange = (value: number[]) => {
    const pCash = value[0] / 100.0;
    setDeal({ ...deal, percent_cash: pCash, percent_stock: 1.0 - pCash });
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 1 }).format(val);
  const formatMillions = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 1 }).format(val) + "m";
  const formatPercent = (val: number) =>
    new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(val);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-sans selection:bg-indigo-500/30">
      <header className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-8 w-8 text-indigo-500" />
            Vigilant M&A Engine
          </h1>
          <p className="text-zinc-400 text-sm mt-1">High-Precision Accretion/Dilution Calculator & Circular Reference Solver</p>
        </div>
        <div className={`px-4 py-2 rounded-full text-sm font-medium ${loading ? 'bg-zinc-800 text-zinc-400' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'}`}>
          {loading ? "Re-calculating..." : "Engine Ready"}
        </div>
      </header>

      {error && (
        <div className="mb-6 bg-red-950/50 border border-red-900 text-red-400 p-4 rounded-md flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* LEFT COLUMN: Input Profiles & Deal Terms (5 columns) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-zinc-900 border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-blue-900/40 to-blue-800/20 px-4 py-3 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200 text-sm">Buyer Setup</h3>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Share Price ($)</Label>
                  <Input type="number" value={buyer.share_price} onChange={e => setBuyer({ ...buyer, share_price: parseFloat(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800 h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Shares (m)</Label>
                  <Input type="number" value={buyer.shares_outstanding} onChange={e => setBuyer({ ...buyer, shares_outstanding: parseFloat(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800 h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Net Income ($m)</Label>
                  <Input type="number" value={buyer.net_income} onChange={e => setBuyer({ ...buyer, net_income: parseFloat(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800 h-9" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 px-4 py-3 border-b border-zinc-800">
                <h3 className="font-semibold text-zinc-200 text-sm">Target Setup</h3>
              </div>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Share Price ($)</Label>
                  <Input type="number" value={target.share_price} onChange={e => setTarget({ ...target, share_price: parseFloat(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800 h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Shares (m)</Label>
                  <Input type="number" value={target.shares_outstanding} onChange={e => setTarget({ ...target, shares_outstanding: parseFloat(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800 h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Net Income ($m)</Label>
                  <Input type="number" value={target.net_income} onChange={e => setTarget({ ...target, net_income: parseFloat(e.target.value) || 0 })} className="bg-zinc-950 border-zinc-800 h-9" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-zinc-900 border-zinc-800 rounded-xl shadow-2xl">
            <CardHeader className="pb-2 border-b border-zinc-800/50">
              <CardTitle className="text-lg flex justify-between items-center">
                <span>Deal Parameters</span>
                <span className="text-xs font-normal text-zinc-400 bg-zinc-800/50 px-2 py-1 rounded">Premium: <span className="text-emerald-400 font-bold">{premium.toFixed(1)}%</span></span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex justify-between">
                  <span>Offer Price per Share</span>
                  <span className="text-indigo-400 font-bold">{formatCurrency(deal.offer_price_per_share)}</span>
                </Label>
                <div className="flex gap-4">
                  <Slider value={[deal.offer_price_per_share]} max={100} step={1} onValueChange={(v: number[]) => setDeal({ ...deal, offer_price_per_share: v[0] })} className="flex-1 my-auto" />
                  <Input type="number" value={deal.offer_price_per_share} onChange={e => setDeal({ ...deal, offer_price_per_share: parseFloat(e.target.value) || 0 })} className="w-20 h-8 text-right bg-zinc-950 border-zinc-800" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-sm font-medium flex justify-between">
                  <span>Cash / Stock Mix</span>
                  <span className="text-zinc-300">{(deal.percent_cash * 100).toFixed(0)}% Cash / {(deal.percent_stock * 100).toFixed(0)}% Stock</span>
                </Label>
                <Slider value={[deal.percent_cash * 100]} max={100} step={5} onValueChange={handleMixChange} className="my-auto" />
              </div>

              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-zinc-800/50">
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Cost of Debt (%)</Label>
                  <Input type="number" step="0.01" value={deal.cost_of_debt * 100} onChange={e => setDeal({ ...deal, cost_of_debt: (parseFloat(e.target.value) || 0) / 100 })} className="bg-zinc-950 border-zinc-800 h-8" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider">Pre-Tax Synergies ($m)</Label>
                  <Input type="number" value={deal.pre_tax_synergies} onChange={e => setDeal({ ...deal, pre_tax_synergies: (parseFloat(e.target.value) || 0) })} className="bg-zinc-950 border-zinc-800 h-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: Outputs (8 columns) */}
        <div className="xl:col-span-8 flex flex-col gap-6">

          {/* Top Line Metrics */}
          {metrics && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-zinc-400 mb-1">Stand. EPS -&gt; Pro Forma EPS</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-white">{formatCurrency(metrics.buyer_standalone_eps)}</span>
                      <span className="text-zinc-500">→</span>
                      <span className="text-3xl font-bold text-indigo-400">{formatCurrency(metrics.pro_forma_eps)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
                <div className={`absolute inset-0 opacity-10 ${metrics.accretion_dilution_percent >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <CardContent className="p-5 relative z-10 flex flex-col justify-center h-full">
                  <p className="text-sm font-medium text-zinc-400 mb-1">Accretion / (Dilution)</p>
                  <p className={`text-4xl font-extrabold tracking-tighter ${metrics.accretion_dilution_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {metrics.accretion_dilution_percent >= 0 ? '+' : ''}{formatPercent(metrics.accretion_dilution_percent)}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-5 flex flex-col justify-center h-full">
                  <p className="text-sm font-medium text-zinc-400 mb-1">Purchase Enterprise Value</p>
                  <p className="text-3xl font-bold text-white">{formatMillions(metrics.purchase_equity_value + (metrics.debt_issued || 0))}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
            {/* Sources & Uses */}
            <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
              <CardHeader className="pb-3 border-b border-zinc-800">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-zinc-400" />
                  Sources & Uses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1">
                {metrics && (
                  <div className="text-sm h-full flex flex-col divide-y divide-zinc-800">
                    <div className="p-4 flex-1">
                      <h4 className="font-semibold text-zinc-300 mb-3 border-b border-zinc-800 pb-1">Sources</h4>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">New Debt Issued</span>
                        <span className="font-mono">{formatMillions(metrics.debt_issued)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">Equity Issued (Stock)</span>
                        <span className="font-mono">{formatMillions(metrics.stock_issued_value)}</span>
                      </div>
                      <div className="flex justify-between py-2 mt-2 border-t border-zinc-800 font-bold">
                        <span>Total Sources</span>
                        <span className="font-mono text-indigo-400">{formatMillions(metrics.total_sources)}</span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 bg-zinc-900/50">
                      <h4 className="font-semibold text-zinc-300 mb-3 border-b border-zinc-800 pb-1">Uses</h4>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">Purchase Equity</span>
                        <span className="font-mono">{formatMillions(metrics.purchase_equity_value)}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-zinc-400">Transaction Fees</span>
                        <span className="font-mono">{formatMillions(metrics.transaction_fees)}</span>
                      </div>
                      <div className="flex justify-between py-2 mt-2 border-t border-zinc-800 font-bold">
                        <span>Total Uses</span>
                        <span className="font-mono text-rose-400">{formatMillions(metrics.total_uses)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sensitivity Heatmap */}
            <Card className="bg-zinc-900 border-zinc-800 flex flex-col">
              <CardHeader className="pb-3 border-b border-zinc-800">
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-zinc-400" />
                  Accretion / Dilution Sensitivity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex-1 flex flex-col">
                <p className="text-xs text-zinc-500 mb-3 text-center uppercase tracking-wide">Purchase Premium (%) vs. Cash Mix (%)</p>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm border-collapse border-2 border-zinc-700">
                    <thead>
                      <tr>
                        <th className="p-2 border border-zinc-700 bg-zinc-900 font-bold text-xs text-zinc-300">Prem \ Cash</th>
                        {[0, 25, 50, 75, 100].map(c => (
                          <th key={c} className="p-2 border border-zinc-700 bg-zinc-900 font-bold text-xs text-zinc-200">{c}%</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[-10, 0, 10, 20, 30, 40].map(prem => (
                        <tr key={prem}>
                          <td className="p-2 border border-zinc-700 bg-zinc-900 font-bold text-xs text-zinc-300 text-center">
                            {prem > 0 ? '+' : ''}{prem}%
                          </td>
                          {[0.0, 0.25, 0.50, 0.75, 1.0].map(mix => {
                            const dp = sensitivities.find(s => Math.abs(s.premium_percent * 100 - prem) < 0.1 && Math.abs(s.percent_cash - mix) < 0.01);
                            const val = dp ? dp.accretion_dilution_percent : 0;
                            const isAcc = val >= 0;
                            // Excel Style Conditional Format intensity
                            const opacity = Math.min(Math.abs(val) * 8, 1);
                            const bg = isAcc ? `rgba(16, 185, 129, ${opacity * 0.8 + 0.2})` : `rgba(244, 63, 94, ${opacity * 0.8 + 0.2})`;
                            const textColor = isAcc ? (opacity > 0.5 ? 'text-emerald-950' : 'text-emerald-300') : (opacity > 0.5 ? 'text-rose-950' : 'text-rose-300');

                            return (
                              <td key={mix} className="p-2 border border-zinc-700 text-center font-mono text-xs transition-colors font-bold" style={{ backgroundColor: bg }}>
                                <span className={textColor}>{dp ? formatPercent(val) : '-'}</span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* EXPERT SUMMARY OF FINDINGS */}
          {metrics && (
            <Card className="bg-zinc-900 border-zinc-700 shadow-lg mt-2">
              <CardHeader className="pb-2 flex flex-row items-center border-b border-zinc-800/50 bg-indigo-500/5">
                <TrendingUp className="h-5 w-5 text-indigo-400 mr-2" />
                <CardTitle className="text-sm font-semibold text-zinc-200">Summary of Findings</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  This transaction is <strong className={metrics.accretion_dilution_percent >= 0 ? "text-emerald-400" : "text-rose-400"}>
                    {Math.abs(metrics.accretion_dilution_percent * 100).toFixed(1)}% {metrics.accretion_dilution_percent >= 0 ? "accretive" : "dilutive"}
                  </strong>, driven primarily by {formatMillions(deal.pre_tax_synergies)} in pre-tax synergies, a {(deal.cost_of_debt * 100).toFixed(1)}% pre-tax cost of debt, and a {(deal.percent_cash * 100).toFixed(0)}% cash mix.
                  The pro-forma EPS adjusts to {formatCurrency(metrics.pro_forma_eps)} from a standalone base of {formatCurrency(metrics.buyer_standalone_eps)}.
                </p>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
