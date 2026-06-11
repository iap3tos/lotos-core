import { useState } from 'react';
import { Broker, ProfileDetails, TrackingData, RemovalStatus, BrokerCategory } from '../types';
import { TRANSLATIONS, Language } from '../data/translations';
import { Search, Flame, Filter, Eye, AlertCircle, CheckCircle2, ShieldAlert, MailOpen, Activity } from 'lucide-react';
import { toGreekUppercase } from '../utils/greekUtils';

interface BrokerListProps {
  brokers: Broker[];
  activeMember: ProfileDetails;
  trackingData: TrackingData;
  onSelectBroker: (brokerId: string) => void;
  language: Language;
}

export default function BrokerList({
  brokers,
  activeMember,
  trackingData,
  onSelectBroker,
  language,
}: BrokerListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BrokerCategory | 'All'>('All');
  const [selectedSensitivity, setSelectedSensitivity] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | RemovalStatus>('All');

  // Mapped user jurisdiction details
  const mapStateToRegion = (state: string): string => {
    if (!state) return 'Global';
    const lowercaseState = state.toLowerCase();
    if (lowercaseState.includes('attica') || lowercaseState.includes('macedonia') || lowercaseState.includes('crete') || lowercaseState.includes('greece') || lowercaseState.includes('(eu gdpr)')) {
      return 'GR';
    }
    if (lowercaseState.includes('california') || lowercaseState.includes('ca') || lowercaseState.includes('us') || lowercaseState.includes('united states')) {
      return 'US';
    }
    if (lowercaseState.includes('eu') || lowercaseState.includes('europe')) {
      return 'EU';
    }
    return 'Global';
  };

  const defaultRegion = mapStateToRegion(activeMember?.state);
  const [selectedRegion, setSelectedRegion] = useState<string>('Auto');

  // Get active tracking records for our member
  const memberState = trackingData[activeMember?.id] || {};

  // Filter logic
  const filteredBrokers = brokers.filter((broker) => {
    // 1. Search Query
    const nameMatch = broker.name.toLowerCase().includes(searchQuery.toLowerCase());
    const domainMatch = broker.domain.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || domainMatch;

    // 2. Category
    const matchesCategory = selectedCategory === 'All' || broker.category === selectedCategory;

    // 3. Sensitivity
    const matchesSensitivity = selectedSensitivity === 'All' || broker.sensitivity === selectedSensitivity;

    // 4. Status filter matching
    const currentStatus = memberState[broker.id]?.status || 'not_started';
    const matchesStatus = selectedStatus === 'All' || currentStatus === selectedStatus;

    // 5. Region filtering
    const activeFilterRegion = selectedRegion === 'Auto' ? defaultRegion : selectedRegion;
    let matchesRegion = true;
    if (activeFilterRegion !== 'All') {
      const brokerRegions = broker.regions || [];
      if (activeFilterRegion === 'Global') {
        matchesRegion = brokerRegions.includes('Global');
      } else {
        matchesRegion = brokerRegions.includes(activeFilterRegion) || brokerRegions.includes('Global');
      }
    }

    return matchesSearch && matchesCategory && matchesSensitivity && matchesStatus && matchesRegion;
  });

  const getLocalizedCategory = (cat: string) => {
    if (language !== 'el') return cat;
    if (cat === 'People Search') return 'Αναζήτηση Ανθρώπων';
    if (cat === 'Marketing & AdTech') return 'Μάρκετινγκ & Διαφήμιση';
    if (cat === 'Financial & Risk') return 'Χρηματοοικονομικά & Κίνδυνος';
    if (cat === 'Recruitment & B2B') return 'Προσλήψεις & B2B';
    return cat;
  };

  return (
    <div className="space-y-6 animate-fade-in" id="directory-tab">
      
      {/* Header element */}
      <div className="border-b border-[#1a1a1a] pb-5">
        <span className="text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">{toGreekUppercase(TRANSLATIONS[language].suppressionDirectory)}</span>
        <h1 className="text-2xl md:text-3xl font-serif text-[#e5e5e5] mt-1">
          {TRANSLATIONS[language].privacyVectors}
        </h1>
        <p className="text-xs text-[#666] mt-1">
          {TRANSLATIONS[language].activeMapping} <strong className="font-semibold text-white">{filteredBrokers.length}</strong> {TRANSLATIONS[language].activeMappingSuffix} <span className="text-[#d4af37] font-semibold">{activeMember?.name || 'Empty Profile'}</span>.
        </p>
      </div>

      {/* Query Search / Filter Panel - Sleek styling */}
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 shadow-xs space-y-4">
        
        {/* Row 1: Search and Selector counts */}
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              autoComplete="off"
              placeholder={TRANSLATIONS[language].searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#050505] border border-[#1a1a1a] rounded-lg pl-9 pr-4 py-2.5 text-xs text-[#e5e5e5] focus:bg-[#050505] focus:ring-1.5 focus:ring-[#d4af37]/45 focus:outline-none transition-all placeholder:text-[#444]"
            />
          </div>

          {/* Quick Stats reset info */}
          {(searchQuery || selectedCategory !== 'All' || selectedSensitivity !== 'All' || selectedStatus !== 'All' || selectedRegion !== 'Auto') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedSensitivity('All');
                setSelectedStatus('All');
                setSelectedRegion('Auto');
              }}
              className="text-xs font-semibold text-[#d4af37] hover:text-white hover:underline self-center px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {TRANSLATIONS[language].resetFilters}
            </button>
          )}
        </div>

        {/* Row 2: Category Filter Chips & Options dropdowns */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          
          {/* Category tabs scroll */}
          <div className="flex items-center gap-1 bg-black p-1 rounded-lg border border-[#1a1a1a]">
            {['All', 'People Search', 'Marketing & AdTech', 'Financial & Risk', 'Recruitment & B2B'].map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as any)}
                  className={`px-3 py-1.5 rounded-md font-medium text-xs transition-all cursor-pointer ${
                    active 
                      ? 'bg-[#111] text-[#d4af37] border border-[#d4af37]/20' 
                      : 'text-[#666] hover:text-white'
                  }`}
                >
                  {cat === 'All' ? TRANSLATIONS[language].allCategories : getLocalizedCategory(cat)}
                </button>
              );
            })}
          </div>

          {/* Separation flex filler */}
          <div className="flex-1 md:block hidden"></div>

          {/* Select parameters */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Sensitivity */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#666] text-[9px] uppercase font-bold tracking-widest">{toGreekUppercase(TRANSLATIONS[language].riskLevel)}</span>
              <select
                value={selectedSensitivity}
                onChange={(e: any) => setSelectedSensitivity(e.target.value)}
                className="bg-[#050505] text-[#e5e5e5] border border-[#1a1a1a] rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-none focus:ring-1.5 focus:ring-[#d4af37]/40 cursor-pointer"
              >
                <option value="All">{TRANSLATIONS[language].allRisks}</option>
                <option value="High">{TRANSLATIONS[language].highRisk}</option>
                <option value="Medium">{TRANSLATIONS[language].mediumRisk}</option>
                <option value="Low">{TRANSLATIONS[language].lowRisk}</option>
              </select>
            </div>

            {/* Tracking Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#666] text-[9px] uppercase font-bold tracking-widest">{toGreekUppercase(TRANSLATIONS[language].trackingStatus)}</span>
              <select
                value={selectedStatus}
                onChange={(e: any) => setSelectedStatus(e.target.value)}
                className="bg-[#050505] text-[#e5e5e5] border border-[#1a1a1a] rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-none focus:ring-1.5 focus:ring-[#d4af37]/40 cursor-pointer"
              >
                <option value="All">{TRANSLATIONS[language].allStatuses}</option>
                <option value="not_started">{TRANSLATIONS[language].statusNotStarted}</option>
                <option value="pending">{TRANSLATIONS[language].statusPending}</option>
                <option value="action_required">{TRANSLATIONS[language].statusActionRequired}</option>
                <option value="completed">{TRANSLATIONS[language].statusCompleted}</option>
                <option value="rejected">{TRANSLATIONS[language].statusRejected}</option>
              </select>
            </div>

            {/* Region Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#666] text-[9px] uppercase font-bold tracking-widest">{toGreekUppercase(TRANSLATIONS[language].filterRegion)}</span>
              <select
                value={selectedRegion}
                onChange={(e: any) => setSelectedRegion(e.target.value)}
                className="bg-[#050505] text-[#e5e5e5] border border-[#1a1a1a] rounded-lg py-1.5 px-2.5 text-xs font-medium focus:outline-none focus:ring-1.5 focus:ring-[#d4af37]/40 cursor-pointer"
              >
                <option value="Auto">
                  {language === 'el' ? `Αυτόματο (${defaultRegion})` : `Auto (${defaultRegion})`}
                </option>
                <option value="GR">GR</option>
                <option value="US">US</option>
                <option value="EU">EU</option>
                <option value="Global">Global</option>
                <option value="All">{TRANSLATIONS[language].allRegions}</option>
              </select>
            </div>

          </div>

        </div>
      </div>

      {/* Grid of Vectors matches */}
      {filteredBrokers.length === 0 ? (
        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl py-16 text-center space-y-3">
          <Eye size={40} className="mx-auto text-zinc-700 animate-pulse" />
          <h3 className="text-base font-serif text-[#e5e5e5]">{TRANSLATIONS[language].noMatchingVectors}</h3>
          <p className="text-xs text-[#666] max-w-sm mx-auto">{TRANSLATIONS[language].noMatchingVectorsDesc}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrokers.map((broker) => {
            const tracking = memberState[broker.id]?.status || 'not_started';
            
            // Status specifics formatting
            let statusPillColor = 'bg-black text-[#666] border border-[#1a1a1a]';
            let statusLabel = language === 'el' ? 'Δεν Έχει Ξεκινήσει' : 'Not Started';
            if (tracking === 'completed') {
              statusPillColor = 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/30';
              statusLabel = language === 'el' ? 'Ολοκληρώθηκε' : 'Completed';
            } else if (tracking === 'pending') {
              statusPillColor = 'bg-blue-950/20 text-blue-400 border border-blue-900/30';
              statusLabel = language === 'el' ? 'Εκκρεμεί Επιβεβαίωση' : 'Pend. Confirmation';
            } else if (tracking === 'action_required') {
              statusPillColor = 'bg-amber-950/20 text-amber-400 border border-amber-900/30';
              statusLabel = language === 'el' ? 'Απαιτείται Ενέργεια' : 'Action Required';
            } else if (tracking === 'rejected') {
              statusPillColor = 'bg-red-950/20 text-red-400 border border-red-900/30';
              statusLabel = language === 'el' ? 'Απορρίφθηκε' : 'Blocked / Rejected';
            }

            // Sensitivity coloring
            let riskBadge = 'bg-[#111] text-[#666] border border-[#1a1a1a]';
            let sensitivityText: string = broker.sensitivity;
            if (broker.sensitivity === 'High') {
              riskBadge = 'bg-red-950/20 text-red-400 border border-red-900/40';
              sensitivityText = language === 'el' ? 'Υψηλού' : 'High';
            } else if (broker.sensitivity === 'Medium') {
              riskBadge = 'bg-amber-950/20 text-amber-400 border border-amber-900/40';
              sensitivityText = language === 'el' ? 'Μεσαίου' : 'Medium';
            } else {
              riskBadge = 'bg-emerald-950/20 text-emerald-400 border border-emerald-900/40';
              sensitivityText = language === 'el' ? 'Χαμηλού' : 'Low';
            }

            return (
              <div
                key={broker.id}
                onClick={() => onSelectBroker(broker.id)}
                className="bg-[#0a0a0a] border border-[#1a1a1a] hover:border-[#d4af37]/45 rounded-xl p-5 flex flex-col justify-between shadow-xs cursor-pointer group transition-all duration-300"
              >
                <div className="space-y-3">
                  
                  {/* Top line Name & Risk */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-semibold text-white group-hover:text-[#d4af37] tracking-tight text-base flex items-center gap-1 transition-colors">
                        {broker.name}
                      </h3>
                      <span className="text-[10px] text-[#444] font-mono tracking-wide">
                        {broker.domain}
                      </span>
                    </div>

                    <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${riskBadge} uppercase inline-flex items-center justify-center text-center`}>
                      {language === 'el' 
                        ? toGreekUppercase(`${sensitivityText} Κινδύνου`) 
                        : `${sensitivityText} Risk`.toUpperCase()}
                    </span>
                  </div>

                  {/* Category Pill details */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="bg-[#111] text-[#888] border border-[#1a1a1a] px-2 py-0.5 rounded font-medium inline-flex items-center justify-center text-center">
                      {getLocalizedCategory(broker.category)}
                    </span>
                    <span className="text-[#333]">•</span>
                    <span className="text-[#666] font-medium font-sans">
                      {TRANSLATIONS[language].method} {broker.optOutMethod}
                    </span>
                  </div>

                  {/* Brief overview description */}
                  <p className="text-xs text-[#888] leading-relaxed line-clamp-2 pr-1 pt-0.5">
                    {language === 'el' && typeof broker.description_el !== 'undefined' ? broker.description_el : broker.description}
                  </p>
                </div>

                {/* Bottom line: Tracking status */}
                <div className="border-t border-[#1a1a1a] pt-3.5 mt-5 flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${statusPillColor} inline-flex items-center justify-center gap-1 text-center`}>
                    {tracking === 'completed' && <CheckCircle2 size={10} />}
                    {tracking === 'action_required' && <AlertCircle size={10} />}
                    {statusLabel}
                  </span>

                  <span className="text-[10px] text-[#666] font-semibold group-hover:text-[#d4af37] group-hover:translate-x-0.5 transition-all flex items-center gap-0.5">
                    {TRANSLATIONS[language].viewInstructions} &rarr;
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
