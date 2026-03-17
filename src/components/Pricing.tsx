import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, Zap, Shield, Star } from 'lucide-react';
import { api } from '../services/api';

interface PricingProps {
  onPlanSelect: (plan: string) => void;
}

export function Pricing({ onPlanSelect }: PricingProps) {
  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect for getting started.',
      features: [
        '2 Simulations per month',
        'Basic AI feedback',
        'Simulation history',
        'Email support'
      ],
      buttonText: 'Current Plan',
      highlight: false
    },
    {
      name: 'Beginner',
      price: '5',
      description: 'For active job seekers.',
      features: [
        'Unlimited Simulations',
        'Advanced AI coaching',
        'Practice reminders',
        'Detailed performance reports',
        'Priority support'
      ],
      buttonText: 'Upgrade to Beginner',
      highlight: true,
      plan_type: 'beginner'
    },
    {
      name: 'Pro',
      price: '15',
      description: 'The ultimate coaching experience.',
      features: [
        'Everything in Beginner',
        'Strategic career roadmap',
        'Mock panel interviews',
        'Salary negotiation AI',
        'Dedicated success manager'
      ],
      buttonText: 'Go Pro',
      highlight: false,
      plan_type: 'pro'
    }
  ];

  const handleSubscribe = async (planType: string) => {
    try {
      const res = await api.stripe.createCheckoutSession(planType);
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      console.error('Failed to create checkout session', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-32 space-y-24">
      <div className="text-center space-y-4">
        <div className="inline-block px-4 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
          <span className="text-red-500 text-[10px] font-black uppercase tracking-widest">
            Investment in your future
          </span>
        </div>
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none italic">
          Choose Your <span className="text-red-600">Strategic Edge</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Unlock unlimited simulations and advanced AI coaching to accelerate your career growth.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative p-12 rounded-[40px] border flex flex-col justify-between ${
              plan.highlight 
                ? 'bg-red-600 border-red-500 text-white' 
                : 'bg-[#111] border-white/5 text-white'
            }`}
          >
            {plan.highlight && (
              <div className="absolute top-8 right-8 bg-white text-red-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </div>
            )}

            <div className="space-y-8">
              <div className="space-y-2">
                <h3 className="text-2xl font-black uppercase tracking-tight italic">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black italic">${plan.price}</span>
                  <span className={`text-xs font-black uppercase tracking-widest ${plan.highlight ? 'text-white/60' : 'text-gray-500'}`}>/month</span>
                </div>
                <p className={`text-sm ${plan.highlight ? 'text-white/70' : 'text-gray-500'}`}>{plan.description}</p>
              </div>

              <ul className="space-y-4">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${plan.highlight ? 'bg-white/20' : 'bg-red-500/10'}`}>
                      <Check size={12} className={plan.highlight ? 'text-white' : 'text-red-500'} />
                    </div>
                    <span className={plan.highlight ? 'text-white/90' : 'text-gray-300'}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button 
              onClick={() => plan.plan_type && handleSubscribe(plan.plan_type)}
              disabled={!plan.plan_type}
              className={`mt-12 w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 transition-all group ${
                plan.highlight 
                  ? 'bg-white text-red-600 hover:bg-gray-100' 
                  : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
              }`}
            >
              {plan.buttonText}
              {plan.plan_type && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-12 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-red-500">
            <Zap size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest">Instant Activation</h4>
            <p className="text-xs text-gray-500">Get started immediately after upgrade.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-red-500">
            <Shield size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest">Secure Payments</h4>
            <p className="text-xs text-gray-500">Encryption powered by Stripe.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-red-500">
            <Star size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase tracking-widest">Satisfaction Guaranteed</h4>
            <p className="text-xs text-gray-500">30-day money back guarantee.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
