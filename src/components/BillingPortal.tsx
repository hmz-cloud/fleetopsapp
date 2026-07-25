import React, { useState } from 'react';
import { 
  CreditCard, Check, Sparkles, ShieldCheck, AlertCircle, 
  Calendar, DollarSign, History, Receipt, ChevronRight, 
  ArrowLeft, ArrowUpRight, Lock, PackageOpen, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Subscription, User } from '../types';

interface BillingPortalProps {
  subscription: Subscription | null;
  onUpdateSubscription: (sub: Subscription) => void;
  currentUser: User | null;
  onNavigate: (page: string) => void;
}

const PLANS = [
  {
    id: 'starter',
    name: 'Starter Tier',
    price: 49,
    period: 'month',
    desc: 'Perfect for small regional fleets getting digitized.',
    features: [
      'Up to 10 vehicles in registry',
      'Basic compliance reminders',
      'Single organization workspace',
      'Standard telemetry plotting',
      'Email alerts support'
    ],
    badgeColor: 'bg-blue-500/10 text-blue-300 border-blue-500/20'
  },
  {
    id: 'professional',
    name: 'Professional Plan',
    price: 149,
    period: 'month',
    desc: 'Our most popular tier. Industrial scale management.',
    features: [
      'Unlimited vehicle registry',
      'Advanced telemetry and map plotting',
      'Full budget & cost-center analytics',
      'Relocation workflow & auto-rules',
      'SMS & Email instant wear warning pings',
      'Priority tech support dispatch'
    ],
    popular: true,
    badgeColor: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Matrix',
    price: 399,
    period: 'month',
    desc: 'For multi-national operations requiring ultimate audit rigor.',
    features: [
      'Everything in Professional',
      'Custom API access & webhooks',
      'SLA-guaranteed priority support',
      'Dedicated compliance specialist',
      'Raw telemetry database dump pipelines',
      'Custom firmware integrations'
    ],
    badgeColor: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
  }
];

export default function BillingPortal({
  subscription,
  onUpdateSubscription,
  currentUser,
  onNavigate
}: BillingPortalProps) {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [checkoutStep, setCheckoutStep] = useState<'plans' | 'checkout' | 'success'>('plans');
  
  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [billingName, setBillingName] = useState(currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '');
  const [cardError, setCardError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Invoice logs mock
  const [mockInvoices] = useState([
    { id: 'INV-2026-004', date: '2026-06-15', amount: subscription?.plan === 'starter' ? 49 : subscription?.plan === 'professional' ? 149 : subscription?.plan === 'enterprise' ? 399 : 0, status: 'paid', plan: subscription?.plan || 'free_trial' },
    { id: 'INV-2026-003', date: '2026-05-15', amount: subscription?.plan === 'starter' ? 49 : subscription?.plan === 'professional' ? 149 : subscription?.plan === 'enterprise' ? 399 : 0, status: 'paid', plan: subscription?.plan || 'free_trial' },
    { id: 'INV-2026-002', date: '2026-04-15', amount: subscription?.plan === 'starter' ? 49 : subscription?.plan === 'professional' ? 149 : subscription?.plan === 'enterprise' ? 399 : 0, status: 'paid', plan: subscription?.plan || 'free_trial' },
  ].filter(inv => inv.amount > 0));

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    let formattedValue = '';
    for (let i = 0; i < value.length; i++) {
      if (i > 0 && i % 4 === 0) formattedValue += ' ';
      formattedValue += value[i];
    }
    setCardNumber(formattedValue.substring(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiry(value.substring(0, 5));
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCvc(e.target.value.replace(/[^0-9]/gi, '').substring(0, 4));
  };

  const handleSelectPlan = (plan: typeof PLANS[0]) => {
    setSelectedPlan(plan);
    setCheckoutStep('checkout');
  };

  const processStripeCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setCardError('');

    if (cardNumber.replace(/\s/g, '').length < 16) {
      setCardError('Invalid card number. Please check and retry.');
      return;
    }
    if (expiry.length < 5) {
      setCardError('Invalid expiration date (MM/YY).');
      return;
    }
    if (cvc.length < 3) {
      setCardError('Invalid CVC code.');
      return;
    }
    if (!billingName.trim()) {
      setCardError('Cardholder name is required.');
      return;
    }

    setIsProcessing(true);

    // Simulate standard Stripe authorization delay
    setTimeout(() => {
      setIsProcessing(false);
      
      const newSub: Subscription = {
        status: 'active',
        plan: selectedPlan!.id as any,
        stripeCustomerId: `cus_${Math.random().toString(36).substring(2, 11)}`,
        stripeSubscriptionId: `sub_${Math.random().toString(36).substring(2, 11)}`,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        priceId: `price_id_${selectedPlan!.id}`,
        billingEmail: currentUser?.email || 'billing@company.sa',
        cardBrand: cardNumber.startsWith('4') ? 'Visa' : cardNumber.startsWith('5') ? 'Mastercard' : 'Amex',
        cardLast4: cardNumber.substring(cardNumber.length - 4)
      };

      onUpdateSubscription(newSub);
      setCheckoutStep('success');
    }, 2000);
  };

  const handleCancelSubscription = () => {
    if (confirm('⚠️ Are you sure you want to cancel your subscription? Your fleet records will remain isolated, but administrative features will lock on subscription end.')) {
      if (subscription) {
        onUpdateSubscription({
          ...subscription,
          status: 'canceled'
        });
      }
    }
  };

  // Get plan specific details
  const activePlanDetails = PLANS.find(p => p.id === subscription?.plan);
  const isTrial = subscription?.plan === 'free_trial' || !subscription;

  // Calculate remaining days for Trial
  const getTrialDaysRemaining = () => {
    if (!subscription?.currentPeriodEnd) return 14;
    const end = new Date(subscription.currentPeriodEnd);
    const today = new Date();
    const diff = end.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#12151f] border border-[#252a3d] rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <CreditCard className="w-5 h-5 text-[#4f8ef7]" />
            <h2 className="text-lg font-bold text-white tracking-tight">SaaS Subscription & Stripe Billing Center</h2>
          </div>
          <p className="text-xs text-[#8b92b8] leading-relaxed">
            Configure multi-tenant commercial plans, provision secure sandbox payments, and review isolated billing audit trails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-[#181c29] border border-[#252a3d] text-[#555e84] px-3 py-1.5 rounded-lg font-semibold uppercase">
            TENANT: {currentUser?.org || 'Default Tenant'}
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* CHECKOUT STEP: PLANS */}
        {checkoutStep === 'plans' && (
          <motion.div
            key="plans-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* CURRENT PLAN BOX */}
            <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute right-0 top-0 w-[40%] h-full bg-[radial-gradient(circle_at_right_top,rgba(79,142,247,0.05)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider block">YOUR SUBSCRIPTION</span>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-white">
                      {isTrial ? 'Free Operational Trial' : activePlanDetails?.name || 'Starter Plan'}
                    </h3>
                    <span className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      subscription?.status === 'active' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 
                      isTrial ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-red-500/10 text-red-300 border-red-500/20'
                    }`}>
                      {subscription?.status || 'Active Trial'}
                    </span>
                  </div>
                  <p className="text-xs text-[#8b92b8]">
                    {isTrial 
                      ? `Your sandbox environment trial is active. You have ${getTrialDaysRemaining()} days remaining to explore Professional features.`
                      : `Billed monthly via Stripe. Next billing execution date: ${subscription?.currentPeriodEnd || 'N/A'}.`
                    }
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch md:items-center gap-3">
                  {!isTrial && subscription?.status !== 'canceled' && (
                    <button
                      onClick={handleCancelSubscription}
                      className="bg-transparent hover:bg-red-500/10 border border-[#252a3d] hover:border-red-500/20 text-[#555e84] hover:text-red-400 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition"
                    >
                      Cancel Plan
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const pro = PLANS.find(p => p.id === 'professional');
                      if (pro) handleSelectPlan(pro);
                    }}
                    className="bg-gradient-to-r from-[#4f8ef7] to-[#7b5ea7] hover:from-[#7aaeff] hover:to-[#9b59b6] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-[#4f8ef7]/10 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                    {isTrial ? 'Upgrade Workspace' : 'Change Plan'}
                  </button>
                </div>
              </div>

              {/* Stripe Payment Method details if present */}
              {subscription?.cardLast4 && (
                <div className="mt-4 pt-4 border-t border-[#252a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="bg-[#181c29] border border-[#252a3d] px-2 py-1 rounded text-[11px] font-mono text-white flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#7aaeff]" />
                      {subscription.cardBrand} •••• {subscription.cardLast4}
                    </div>
                    <span className="text-[#555e84]">Billing associated with {subscription.billingEmail}</span>
                  </div>
                  <span className="text-[#8b92b8] font-semibold text-[11px] bg-white/5 border border-white/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Secure Stripe Cust ID: {subscription.stripeCustomerId}
                  </span>
                </div>
              )}
            </div>

            {/* COMMERCIAL PRICING TIER CARDS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {PLANS.map((plan) => {
                const isActive = subscription?.plan === plan.id;
                return (
                  <div 
                    key={plan.id}
                    className={`bg-[#12151f] border rounded-2xl p-5 flex flex-col justify-between relative transition duration-200 ${
                      plan.popular ? 'border-[#4f8ef7]/50 shadow-[0_4px_24px_rgba(79,142,247,0.05)]' : 'border-[#252a3d] hover:border-[#313757]'
                    }`}
                  >
                    {plan.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#4f8ef7] to-[#7b5ea7] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full shadow-lg">
                        RECOMMENDED
                      </span>
                    )}

                    <div className="space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                          <p className="text-[11px] text-[#8b92b8] mt-1 leading-relaxed">{plan.desc}</p>
                        </div>
                        {isActive && (
                          <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                            Current
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1 py-1">
                        <span className="text-3xl font-black text-white">${plan.price}</span>
                        <span className="text-xs text-[#555e84]">/ {plan.period}</span>
                      </div>

                      <div className="border-t border-[#252a3d] pt-4 space-y-2.5">
                        <span className="text-[9px] font-bold text-[#555e84] uppercase tracking-wider block">PLAN BENEFITS</span>
                        {plan.features.map((feat, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-[#8b92b8] leading-tight">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPlan(plan)}
                      disabled={isActive}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold tracking-wide mt-6 transition ${
                        isActive 
                          ? 'bg-[#181c29] border border-[#252a3d] text-[#555e84] cursor-default'
                          : plan.popular
                            ? 'bg-[#4f8ef7] hover:bg-[#7aaeff] text-white shadow-md'
                            : 'bg-[#1e2330] hover:bg-[#252b3d] border border-[#252a3d] text-white'
                      }`}
                    >
                      {isActive ? 'Current Plan' : `Subscribe to ${plan.name.split(' ')[0]}`}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* MOCK INVOICE LOGS */}
            {mockInvoices.length > 0 && (
              <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 pb-1 border-b border-[#252a3d]">
                  <Receipt className="w-4 h-4 text-[#7aaeff]" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Stripe Invoice & Payment Logs</h4>
                </div>
                <div className="divide-y divide-[#252a3d]">
                  {mockInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#181c29] border border-[#252a3d] flex items-center justify-center font-mono font-bold text-white">
                          CSV
                        </div>
                        <div>
                          <div className="font-bold text-white">{inv.id}</div>
                          <div className="text-[10px] text-[#555e84] mt-0.5">Billed on {inv.date} • Plan: {inv.plan.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-mono font-bold text-white">${inv.amount}.00 USD</span>
                        <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Paid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* CHECKOUT STEP: STRIPE SIMULATED CHECKOUT */}
        {checkoutStep === 'checkout' && selectedPlan && (
          <motion.div
            key="checkout-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          >
            {/* CHECKOUT BOX */}
            <div className="lg:col-span-3 bg-[#12151f] border border-[#252a3d] rounded-2xl p-6 space-y-6">
              <button 
                onClick={() => setCheckoutStep('plans')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8b92b8] hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Select a different plan
              </button>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-[#4f8ef7]/10 rounded-md flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5 text-[#7aaeff]" />
                  </div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Secure Stripe Checkout Node</h3>
                </div>
                <p className="text-xs text-[#8b92b8]">
                  Operational billing data is isolated in your dedicated tenant partition. Powered by Stripe Sandbox.
                </p>
              </div>

              <form onSubmit={processStripeCheckout} className="space-y-4">
                {cardError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{cardError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#8b92b8] uppercase tracking-wider block">Cardholder Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Hassan Zarroug"
                    value={billingName}
                    onChange={(e) => setBillingName(e.target.value)}
                    required
                    className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-[#8b92b8] uppercase tracking-wider block">Card Details</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="4242 4242 4242 4242"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition font-mono"
                    />
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555e84]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#8b92b8] uppercase tracking-wider block">Expires (MM/YY)</label>
                    <input 
                      type="text" 
                      placeholder="12/28"
                      value={expiry}
                      onChange={handleExpiryChange}
                      required
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#8b92b8] uppercase tracking-wider block">CVC Security Code</label>
                    <input 
                      type="password" 
                      placeholder="•••"
                      value={cvc}
                      onChange={handleCvcChange}
                      required
                      className="w-full bg-[#181c29] border border-[#252a3d] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#555e84] focus:outline-none focus:border-[#4f8ef7] transition font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-[#4f8ef7] to-[#7b5ea7] hover:from-[#7aaeff] hover:to-[#9b59b6] text-white py-3 rounded-xl text-xs font-bold tracking-wide transition shadow-lg shadow-[#4f8ef7]/10 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Contacting Stripe Merchant...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Authorize Billing & Subscribe (${selectedPlan.price}.00)
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* ORDER SUMMARY */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-4">
                <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider block">Cart Subtotals</span>
                
                <div className="space-y-3 pb-3 border-b border-[#252a3d]">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b92b8] font-medium">{selectedPlan.name} Subscription</span>
                    <span className="font-mono font-bold text-white">${selectedPlan.price}.00</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#8b92b8] font-medium">VAT & Operations Surcharges</span>
                    <span className="font-mono font-bold text-[#555e84]">$0.00</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-white">
                  <span>Authorized Monthly Price</span>
                  <span className="font-mono text-[#7aaeff] text-lg">${selectedPlan.price}.00 USD</span>
                </div>
              </div>

              <div className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-5 space-y-3 text-xs">
                <span className="text-[10px] font-bold text-[#555e84] uppercase tracking-wider block">Sandbox Payment Shortcuts</span>
                <p className="text-[11px] text-[#8b92b8]">Use the standard test credit card to trigger mock authorization pipelines:</p>
                
                <div className="p-3 bg-[#181c29] border border-[#252a3d] rounded-xl font-mono text-[11px] text-[#7aaeff] space-y-1">
                  <div>Card: <span className="text-white font-bold">4242 4242 4242 4242</span></div>
                  <div>Expiry: <span className="text-white">12/28</span></div>
                  <div>CVC: <span className="text-white">424</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CHECKOUT STEP: SUCCESS */}
        {checkoutStep === 'success' && selectedPlan && (
          <motion.div
            key="success-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#12151f] border border-[#252a3d] rounded-2xl p-8 max-w-lg mx-auto text-center space-y-6"
          >
            <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-white">Stripe Checkout Authorized!</h3>
              <p className="text-xs text-[#8b92b8] leading-relaxed">
                Thank you! Your corporate space for <span className="text-white font-bold">{currentUser?.org}</span> has been upgraded to the <span className="text-[#7aaeff] font-bold">{selectedPlan.name}</span>. Multi-tenant database limits have been successfully expanded.
              </p>
            </div>

            <div className="p-4 bg-[#181c29] border border-[#252a3d] rounded-xl text-left divide-y divide-[#252a3d] text-xs">
              <div className="flex justify-between py-2">
                <span className="text-[#8b92b8]">Authorized Plan:</span>
                <span className="text-white font-bold">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8b92b8]">Billing Execution cycle:</span>
                <span className="text-white">Monthly</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#8b92b8]">Next Invoice Execution:</span>
                <span className="text-white">{subscription?.currentPeriodEnd}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCheckoutStep('plans');
                onNavigate('dashboard');
              }}
              className="w-full bg-[#1e2330] hover:bg-[#252b3d] border border-[#252a3d] text-white py-2.5 rounded-xl text-xs font-bold tracking-wide transition"
            >
              Return to Fleet Dashboard
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
