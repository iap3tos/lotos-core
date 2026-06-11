export type BrokerCategory = 'People Search' | 'Marketing & AdTech' | 'Financial & Risk' | 'Recruitment & B2B';

export interface Broker {
  id: string;
  name: string;
  domain: string;
  category: BrokerCategory;
  description: string;
  description_el?: string;
  category_el?: string;
  sensitivity: 'Low' | 'Medium' | 'High';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  optOutMethod: 'Email' | 'Web Form' | 'Both' | 'Mail/Phone';
  optOutEmail?: string;
  optOutUrl?: string;
  instructions: string[];
  instructions_el?: string[];
  regions: string[];
}

export interface ProfileDetails {
  id: string; // unique profile identifier
  name: string;
  latinName?: string;
  email: string;
  alternativeEmails: string[];
  phone: string;
  state: string;
  city: string;
  address: string;
  postalCode: string;
}

export type RemovalStatus = 'not_started' | 'pending' | 'action_required' | 'completed' | 'rejected';

export interface MemberRemovalState {
  status: RemovalStatus;
  updatedAt: string;
  notes: string;
}

// Map from profileId -> brokerId -> action-state
export interface TrackingData {
  [memberId: string]: {
    [brokerId: string]: MemberRemovalState;
  };
}

export interface HistoryItem {
  id: string;
  memberId: string;
  memberName: string;
  brokerId: string;
  brokerName: string;
  action: 'sent_email' | 'form_visited' | 'status_changed';
  fromStatus?: RemovalStatus;
  toStatus?: RemovalStatus;
  timestamp: string;
  notes?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
