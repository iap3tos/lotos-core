import { Broker } from '../types';

export const BROKERS_DATABASE: Broker[] = [
  // GREEK PUBLIC DIRECTORIES / PEOPLE SEARCH (CRITICAL GREEK DATA)
  {
    id: '11888',
    name: '11888.gr (OTE General Directory)',
    domain: '11888.gr',
    category: 'People Search',
    description: 'Greece\'s national operator telephone and directory database under OTE. Contains landlines, mobile telephone registries, and residential address maps of Greek citizens.',
    description_el: 'Η εθνική βάση δεδομένων τηλεφωνικού καταλόγου της Ελλάδας υπό τον ΟΤΕ. Περιέχει σταθερά, κινητά τηλέφωνα και χάρτες διευθύνσεων κατοικίας των Ελλήνων πολιτών.',
    sensitivity: 'High',
    difficulty: 'Medium',
    optOutMethod: 'Both',
    optOutEmail: 'privacy@note.gr',
    optOutUrl: 'https://www.11888.gr/privacy/',
    regions: ['GR'],
    instructions: [
      'Pursuant to Article 11 of Greek Law 3471/2006, citizens have the right to request unlisting from OTE standard public files.',
      'Submit a formal unlisting request with the OTE customer care privacy division.',
      'To opt out via email, send a copy of your Greek GDPR citation to privacy@note.gr or call 13888 (OTE Customer Support).',
      'Or complete the request at the nearest local COSMOTE / GERMANOS branch inside Greece, providing your validated ID document.'
    ],
    instructions_el: [
      'Σύμφωνα με το Άρθρο 11 του Ελληνικού Νόμου 3471/2006, οι πολίτες έχουν δικαίωμα εξαίρεσης από τα δημόσια αρχεία του ΟΤΕ.',
      'Υποβάλετε επίσημο αίτημα διαγραφής στο τμήμα προστασίας απορρήτου του ΟΤΕ.',
      'Για να εξαιρεθείτε μέσω email, στείλτε ένα αίτημα βασισμένο στο GDPR στο privacy@note.gr ή καλέστε στο 13888 (Εξυπηρέτηση ΟΤΕ).',
      'Εναλλακτικά, ολοκληρώστε το αίτημα στο πλησιέστερο κατάστημα COSMOTE / ΓΕΡΜΑΝΟΣ στην Ελλάδα, επιδεικνύοντας την ταυτότητά σας.'
    ]
  },
  {
    id: 'vrisko',
    name: 'Vrisko.gr',
    domain: 'vrisko.gr',
    category: 'People Search',
    description: 'A major Greek people search directory. Gathers telephone databases, physical address details, and coordinates of Greek individuals and corporate lists.',
    description_el: 'Ένας μεγάλος ελληνικός κατάλογος αναζήτησης ανθρώπων. Συγκεντρώνει τηλεφωνικές βάσεις, διευθύνσεις κατοικίας και γεωγραφικές συντεταγμένες Ελλήνων ιδιωτών και επαγγελματιών.',
    sensitivity: 'High',
    difficulty: 'Easy',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.vrisko.gr/contact',
    regions: ['GR'],
    instructions: [
      'Locate your personal or business listing on vrisko.gr.',
      'Copy the link containing your profile ID from your browser\'s tab bar.',
      'Click on the "Contact us / Επικοινωνία" portal page URL.',
      'Choose the "Data Correction/Deletion Form (Αίτημα Διαγραφής)" from the request dropdown.',
      'Paste your copied listing profile link, and state your formal erasure rights under Greek Law 4624/2019.'
    ],
    instructions_el: [
      'Εντοπίστε την προσωπική ή επαγγελματική σας καταχώριση στο vrisko.gr.',
      'Αντιγράψτε τον σύνδεσμο με το αναγνωριστικό προφίλ σας από τη γραμμή διευθύνσεων.',
      'Μεταβείτε στη σελίδα επικοινωνίας του vrisko.gr.',
      'Επιλέξτε τη φόρμα "Αίτημα Διαγραφής / Διόρθωσης Στοιχείων" από το μενού.',
      'Επικολλήστε τον σύνδεσμο του προφίλ σας και δηλώστε τα επίσημα δικαιώματα διαγραφής σας βάσει του Νόμου 4624/2019.'
    ]
  },
  {
    id: 'xrysoi-odigoi',
    name: 'xo.gr (Greek Yellow Pages / Χρυσός Οδηγός)',
    domain: 'xo.gr',
    category: 'People Search',
    description: 'The most popular corporate, retail, and freelancer search directory inside Greece. Scrapes professionals, emails, and address locations across Greece.',
    description_el: 'Ο πιο δημοφιλής κατάλογος αναζήτησης εταιρειών και ελεύθερων επαγγελματιών στην Ελλάδα. Συλλέγει στοιχεία επαγγελματιών, email και διευθύνσεις.',
    sensitivity: 'Medium',
    difficulty: 'Easy',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.xo.gr/contact-forms/customer-support/',
    regions: ['GR'],
    instructions: [
      'Search for your name, phone number, or professional listing at xo.gr.',
      'Open the "Customer Support Form (Επικοινωνία)" link listed above.',
      'Select "Request Deletion of My Personal Listing (Αίτημα Διαγραφής Στοιχείων)".',
      'Mention your full name and the phone number/listing URL you wish to delete under GDPR Article 17 (Right to Erasure).',
      'Confirmation is processed by the Greek compliance desk within 10-15 business days.'
    ],
    instructions_el: [
      'Αναζητήστε το όνομά σας, το τηλέφωνο ή την καταχώριση επαγγελματία στο xo.gr.',
      'Ανοίξτε τη Φόρμα Εξυπηρέτησης Πελατών (Επικοινωνία) που αναφέρεται παραπάνω.',
      'Επιλέξτε "Αίτημα Διαγραφής Στοιχείων".',
      'Αναφέρετε το πλήρες όνομά σας και το τηλέφωνο/σύνδεσμο που θέλετε να διαγράψετε βάσει του Άρθρου 17 του GDPR (Δικαίωμα στη Λήθη).',
      'Η επιβεβαίωση ολοκληρώνεται από το ελληνικό τμήμα συμμόρφωσης εντός 10-15 εργάσιμων ημερών.'
    ]
  },
  {
    id: '11880',
    name: '11880.gr (Greek Business & Name Search)',
    domain: '11880.gr',
    category: 'People Search',
    description: 'A highly visited telephone directory active in Greece, delivering name lookup and landline reverse trace indices that scrape public registers.',
    description_el: 'Ένας δημοφιλής τηλεφωνικός κατάλογος στην Ελλάδα, που παρέχει αναζήτηση ονομάτων και αντίστροφη εύρεση σταθερών τηλεφώνων.',
    sensitivity: 'Medium',
    difficulty: 'Medium',
    optOutMethod: 'Email',
    optOutEmail: 'info@11880.gr',
    optOutUrl: 'https://www.11880.gr',
    regions: ['GR'],
    instructions: [
      'Identify if your mobile phone or landline numbers are matched on 11880 listings.',
      'Draft a deletion demand referencing Greece GDPR Law 4624/2019.',
      'Email your detailed request to info@11880.gr containing your target phone listing details.',
      'The directory support team will remove your details from their internal indexes.'
    ],
    instructions_el: [
      'Ελέγξτε εάν τα κινητά ή σταθερά τηλέφωνά σας εμφανίζονται στις λίστες του 11880.',
      'Συντάξτε ένα αίτημα διαγραφής αναφέροντας τον ελληνικό Νόμο 4624/2019 (GDPR).',
      'Στείλτε το αίτημά σας στο info@11880.gr συμπεριλαμβάνοντας τα στοιχεία τηλεφώνου που επιθυμείτε να αφαιρέσετε.',
      'Η ομάδα υποστήριξης θα αφαιρέσει τα στοιχεία σας από τα ευρετήριά της.'
    ]
  },

  // 1. GLOBAL MARKETING & ADTECH BROKERS (USER RESEARCH MATCHED)
  {
    id: 'criteo',
    name: 'Criteo SA',
    domain: 'criteo.com',
    category: 'Marketing & AdTech',
    description: 'A primary European digital ad retargeting giant based in France. Builds comprehensive consumer shopping habits, device identifiers, and behavioral profiles of European internet surfers.',
    description_el: 'Ένας κορυφαίος ευρωπαϊκός γίγαντας ψηφιακού ad retargeting με έδρα τη Γαλλία. Δημιουργεί αναλυτικά προφίλ αγοραστικών συνηθειών, αναγνωριστικών συσκευών και συμπεριφοράς Ευρωπαίων χρηστών.',
    sensitivity: 'Medium',
    difficulty: 'Easy',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.criteo.com/privacy/disable-criteo-services-on-your-browser/',
    regions: ['Global'],
    instructions: [
      'Criteo profiles millions of Greek shoppers and sets dynamic device retargeting tags.',
      'Open the Criteo privacy link given above inside your main web browsers.',
      'Turn on their global browser opt-out cookie/blocker to disable real-time ad mapping.',
      'Enter your active email addresses in their digital identifier opt-out box to unlink device tracking.'
    ],
    instructions_el: [
      'Η Criteo δημιουργεί προφίλ για εκατομμύρια Έλληνες καταναλωτές και ορίζει ετικέτες retargeting.',
      'Ανοίξτε τον σύνδεσμο απορρήτου της Criteo στα κύρια προγράμματα περιήγησής σας.',
      'Ενεργοποιήστε τον καθολικό αποκλεισμό cookie/opt-out της Criteo.',
      'Εισαγάγετε τις ενεργές διευθύνσεις email σας στο πλαίσιο εξαίρεσης αναγνωριστικών για να καταργήσετε τη σύνδεση παρακολούθησης συσκευής.'
    ]
  },
  {
    id: 'yahoo',
    name: 'Yahoo EMEA Ltd.',
    domain: 'yahoo.com',
    category: 'Marketing & AdTech',
    description: 'Yahoo EMEA coordinates search trackers, content networks, ad platforms, and device tagging tracking millions of Greek citizens using web portals or partner publications.',
    description_el: 'Η Yahoo EMEA συντονίζει ιχνηλάτες αναζήτησης, δίκτυα περιεχομένου, διαφημιστικές πλατφόρμες και σήμανση συσκευών που παρακολουθούν εκατομμύρια Έλληνες πολίτες μέσω πυλών και συνεργαζόμενων ιστότοπων.',
    sensitivity: 'Medium',
    difficulty: 'Medium',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.yahooinc.com/portal/privacy/emea',
    optOutEmail: 'privacy-emea@yahooinc.com',
    regions: ['Global'],
    instructions: [
      'Visit the Yahoo EMEA Privacy Dashboard linked above.',
      'Under "EU GDPR Privacy Framework Options", request unlinking of your digital profile.',
      'Enter all active email addresses or submit a deletion request directly to privacy-emea@yahooinc.com.'
    ],
    instructions_el: [
      'Επισκεφθείτε τον Πίνακα Απορρήτου της Yahoo EMEA στον παραπάνω σύνδεσμο.',
      'Κάτω από τις επιλογές "EU GDPR Privacy Framework", ζητήστε την κατάργηση σύνδεσης του ψηφιακού σας προφίλ.',
      'Εισαγάγετε όλα τα ενεργά email σας ή στείλτε αίτημα απευθείας στο privacy-emea@yahooinc.com.'
    ]
  },
  {
    id: 'ogury',
    name: 'Ogury Ltd.',
    domain: 'ogury.com',
    category: 'Marketing & AdTech',
    description: 'Global mobile advertising network specializing in smartphone target profiling and identity cohort generation across Europe.',
    description_el: 'Παγκόσμιο δίκτυο διαφήμισης για κινητά που ειδικεύεται στη χαρτογράφηση προφίλ χρηστών smartphone και τη δημιουργία ψηφιακών ομάδων κοινού στην Ευρώπη.',
    sensitivity: 'Medium',
    difficulty: 'Easy',
    optOutMethod: 'Email',
    optOutEmail: 'privacy@ogury.com',
    regions: ['Global'],
    instructions: [
      'Open Ogury\'s privacy request division by sending an email query to privacy@ogury.com.',
      'Provide your mobile device identifiers (IDFA/GAID) if known, and state your email identifiers.',
      'Demand deletion of historical profile categories in accordance with EU GDPR Article 17.'
    ],
    instructions_el: [
      'Επικοινωνήστε με το τμήμα συμμόρφωσης απορρήτου της Ogury στέλνοντας μήνυμα στο privacy@ogury.com.',
      'Παρέχετε τα αναγνωριστικά της κινητής συσκευής σας (IDFA/GAID) εάν είναι γνωστά, καθώς και τα email σας.',
      'Απαιτήστε τη διαγραφή του ιστορικού προφίλ σας σύμφωνα με το Άρθρο 17 του GDPR.'
    ]
  },
  {
    id: 'rtbhouse',
    name: 'RTB House S.A.',
    domain: 'rtbhouse.com',
    category: 'Marketing & AdTech',
    description: 'Retargeting ad platform that executes real-time dynamic bidding campaigns across Europe utilizing behavioral algorithms.',
    description_el: 'Πλατφόρμα διαφημιστικού retargeting που εκτελεί δυναμικές καμπάνιες προσφορών σε πραγματικό χρόνο στην Ευρώπη χρησιμοποιώντας αλγόριθμους συμπεριπεριφοράς.',
    sensitivity: 'Medium',
    difficulty: 'Easy',
    optOutMethod: 'Both',
    optOutEmail: 'privacy@rtbhouse.com',
    optOutUrl: 'https://rtbhouse.com/optout-instructions',
    regions: ['Global'],
    instructions: [
      'Visit the RTB House Opt-Out instructions portal.',
      'Follow instructions to activate their permanent browser cookie block.',
      'Draft an e-mail request to privacy@rtbhouse.com to purge your email hashes from their real-time marketing campaigns.'
    ],
    instructions_el: [
      'Επισκεφθείτε την πύλη οδηγιών εξαίρεσης (Opt-Out) της RTB House.',
      'Ακολουθήστε τις οδηγίες για να ενεργοποιήσετε το μόνιμο cookie εξαίρεσης στο πρόγραμμα περιήγησης.',
      'Στείλτε email στο privacy@rtbhouse.com ζητώντας να διαγραφούν τα κρυπτογραφημένα email σας από τις καμπάνιες μάρκετινγκ.'
    ]
  },
  {
    id: 'sirdata',
    name: 'Sirdata',
    domain: 'sirdata.com',
    category: 'Marketing & AdTech',
    description: 'Prominent French programmatic data agency that collects web data and distributes audience segment packages across European ad exchanges.',
    description_el: 'Εξέχουσα γαλλική εταιρεία προγραμματιστικών δεδομένων που συλλέγει στοιχεία ιστού και διανέμει πακέτα κοινού σε ευρωπαϊκά διαφημιστικά δίκτυα.',
    sensitivity: 'Medium',
    difficulty: 'Easy',
    optOutMethod: 'Both',
    optOutEmail: 'privacy@sirdata.fr',
    optOutUrl: 'https://www.sirdata.com/opt-out/',
    regions: ['Global'],
    instructions: [
      'Navigate to Sirdata\'s dedicated Opt-Out portal.',
      'Click the opt-out buttons to store a deletion token for your current web browser profile.',
      'Additionally, send a GDPR request text to privacy@sirdata.fr to purge offline audience records matching your email.'
    ],
    instructions_el: [
      'Μεταβείτε στην ειδική πύλη Opt-Out της Sirdata.',
      'Κάντε κλικ στα κουμπιά εξαίρεσης για να αποθηκεύσετε ένα διακριτικό διαγραφής για το τρέχον πρόγραμμα περιήγησής σας.',
      'Επιπλέον, στείλτε ένα αίτημα GDPR στο privacy@sirdata.fr για να αφαιρέσετε τα αρχεία κοινού εκτός σύνδεσης που αντιστοιχούν στο email σας.'
    ]
  },
  {
    id: 'thetradedesk',
    name: 'The Trade Desk',
    domain: 'thetradedesk.com',
    category: 'Marketing & AdTech',
    description: 'The largest independent demand-side platform (DSP). Aggregates Unified ID 2.0 (UID2) identifiers containing hashed email coordinates of global shoppers.',
    description_el: 'Η μεγαλύτερη ανεξάρτητη πλατφόρμα ζήτησης διαφημίσεων (DSP). Συγκεντρώνει αναγνωριστικά Unified ID 2.0 (UID2) που περιέχουν κρυπτογραφημένα email καταναλωτών.',
    sensitivity: 'Medium',
    difficulty: 'Medium',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.thetradedesk.com/us/privacy',
    regions: ['Global'],
    instructions: [
      'Go to The Trade Desk general privacy policy page.',
      'Find their GDPR web request tool under "EU User Rights".',
      'Submit your active email addresses to permanently suppress them from participating in UID2 auctioning networks.'
    ],
    instructions_el: [
      'Μεταβείτε στη γενική σελίδα πολιτικής απορρήτου της The Trade Desk.',
      'Εντοπίστε τη φόρμα αιτημάτων GDPR κάτω από την ενότητα "EU User Rights".',
      'Υποβάλετε τις ενεργές διευθύνσεις email σας για να τις εξαιρέσετε μόνιμα από το δίκτυο δημοπρασιών UID2.'
    ]
  },
  {
    id: 'quantcast',
    name: 'Quantcast',
    domain: 'quantcast.com',
    category: 'Marketing & AdTech',
    description: 'Global tracking system specializing in cookies, demographics, and interest mapping used on millions of European sites.',
    description_el: 'Παγκόσμιο σύστημα παρακολούθησης που ειδικεύεται σε cookies, δημογραφικά στοιχεία και χαρτογράφηση ενδιαφερόντων σε εκατομμύρια ευρωπαϊκούς ιστότοπους.',
    sensitivity: 'Medium',
    difficulty: 'Easy',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.quantcast.com/opt-out/',
    regions: ['Global'],
    instructions: [
      'Visit Quantcast\'s public Opt-Out portal.',
      'Toggle off the browser measurement settings to stop data capture linked with your profile identifiers.',
      'State your email to request database level suppression from partner advertising matches.'
    ],
    instructions_el: [
      'Επισκεφθείτε τη δημόσια πύλη Opt-Out της Quantcast.',
      'Απενεργοποιήστε τις ρυθμίσεις μέτρησης του προγράμματος περιήγησης για να σταματήσει η καταγραφή δεδομένων συσκευής.',
      'Εισαγάγετε το email σας για να ζητήσετε καταστολή σε επίπεδο βάσης δεδομένων από διαφημιστικές αντιστοιχίσεις.'
    ]
  },
  {
    id: 'infobel',
    name: 'Infobel (Kapitol SA)',
    domain: 'infobel.com',
    category: 'Marketing & AdTech',
    description: 'Belgian directory aggregator publishing extensive company and local household contact listings across Greece. Packages telephone numbers and address markers.',
    description_el: 'Βελγικός κατάλογος που δημοσιεύει εκτενείς λίστες εταιρειών και νοικοκυριών στην Ελλάδα. Συγκεντρώνει εκατομμύρια τηλέφωνα και διευθύνσεις.',
    sensitivity: 'High',
    difficulty: 'Medium',
    optOutMethod: 'Email',
    optOutEmail: 'privacy@kapitol.com',
    optOutUrl: 'https://greece.infobel.com',
    regions: ['GR', 'Global'],
    instructions: [
      'Search greece.infobel.com to locate if your name or landline listings are published.',
      'Draft a GDPR deletion email citing Article 17 Erasure parameters.',
      'Send the email directly to privacy@kapitol.com including your profile links.',
      'Verification of deletion forms is processed by Kapitol S.A. compliance officers within 30 days.'
    ],
    instructions_el: [
      'Αναζητήστε στο greece.infobel.com για να δείτε εάν το όνομα ή το τηλέφωνό σας είναι δημοσιευμένα.',
      'Συντάξτε ένα email διαγραφής GDPR αναφέροντας το Άρθρο 17 (Δικαίωμα στη Λήθη).',
      'Στείλτε το αίτημα απευθείας στο privacy@kapitol.com συμπεριλαμβάνοντας τους συνδέσμους των καταχωρίσεών σας.',
      'Η επιβεβαίωση ολοκληρώνεται από τους υπεύθυνους συμμόρφωσης της Kapitol S.A. εντός 30 ημερών.'
    ]
  },

  // 2. B2B INTELLIGENCE & LEAD GENERATION BROKERS (USER RESEARCH MATCHED)
  {
    id: 'cognism',
    name: 'Cognism',
    domain: 'cognism.com',
    category: 'Recruitment & B2B',
    description: 'UK-based sales intelligence platform indexing personal contact data, professional emails, direct dial phone lists, and corporate hierarchies of Greek and European executives.',
    description_el: 'Πλατφόρμα B2B πληροφοριών πωλήσεων με έδρα το Ηνωμένο Βασίλειο, η οποία καταγράφει προσωπικά στοιχεία επικοινωνίας, επαγγελματικά email και τηλέφωνα στελεχών στην Ελλάδα και την ΕΕ.',
    sensitivity: 'High',
    difficulty: 'Easy',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.cognism.com/opt-out',
    regions: ['Global'],
    instructions: [
      'Navigate to Cognism\'s official Opt-Out database tool.',
      'Input either your personal or work email to scan their directories.',
      'Proceed with the opt-out demand to block sales companies from purchasing your direct cell number or business coordinates.'
    ],
    instructions_el: [
      'Μεταβείτε στο επίσημο εργαλείο εξαίρεσης (Opt-Out) της Cognism.',
      'Εισαγάγετε το προσωπικό ή εταιρικό σας email για να σαρώσετε τη βάση δεδομένων τους.',
      'Ολοκληρώστε το αίτημα εξαίρεσης για να εμποδίσετε τις εταιρείες πωλήσεων να αγοράζουν το κινητό σας ή άλλα επαγγελματικά σας στοιχεία.'
    ]
  },
  {
    id: 'apollo',
    name: 'Apollo.io',
    domain: 'apollo.io',
    category: 'Recruitment & B2B',
    description: 'Large-scale cold recruitment and sales automation system compiling LinkedIn data, job metrics, personal cells, and email coordinates of Greek professionals.',
    description_el: 'Σύστημα αυτοματοποίησης πωλήσεων και προσλήψεων μεγάλης κλίμακας που συλλέγει δεδομένα LinkedIn, στοιχεία θέσεων εργασίας, κινητά τηλέφωνα και email Ελλήνων επαγγελματιών.',
    sensitivity: 'Medium',
    difficulty: 'Easy',
    optOutMethod: 'Both',
    optOutEmail: 'privacy@apollo.io',
    optOutUrl: 'https://www.apollo.io/privacy-policy/opt-out/',
    regions: ['Global'],
    instructions: [
      'Enter your active LinkedIn link or work email on Apollo\'s opt-out form.',
      'Confirm the request via their confirmation email verification loop.',
      'Alternatively, email privacy@apollo.io requesting complete erasure from their B2B database citing EU GDPR.'
    ],
    instructions_el: [
      'Εισαγάγετε τον σύνδεσμο του LinkedIn ή το email εργασίας σας στη φόρμα εξαίρεσης της Apollo.',
      'Επαληθεύστε το αίτημα μέσω του email επιβεβαίωσης που θα λάβετε.',
      'Εναλλακτικά, στείλτε email στο privacy@apollo.io ζητώντας πλήρη διαγραφή από τη βάση δεδομένων B2B αναφέροντας το GDPR.'
    ]
  },
  {
    id: 'zoominfo',
    name: 'ZoomInfo',
    domain: 'zoominfo.com',
    category: 'Recruitment & B2B',
    description: 'Extensive corporate intelligence database that scrapes corporate charts, company emails, direct extensions, and employment histories globally, including Greece.',
    description_el: 'Εκτενής βάση δεδομένων επιχειρηματικών πληροφοριών που συλλέγει οργανογράμματα εταιρειών, διευθύνσεις email, τηλέφωνα και ιστορικό απασχόλησης παγκοσμίως (και στην Ελλάδα).',
    sensitivity: 'High',
    difficulty: 'Medium',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.zoominfo.com/update/remove',
    regions: ['Global'],
    instructions: [
      'Open the official ZoomInfo EU compliance/erasure form portal.',
      'Submit your primary business email to locate your professional record card.',
      'Check your email and click their validation link to prove identity.',
      'Complete the web form representing your demand to purge your cell phone configurations and job mapping.'
    ],
    instructions_el: [
      'Ανοίξτε την επίσημη πύλη αιτημάτων διαγραφής / συμμόρφωσης της ZoomInfo για την ΕΕ.',
      'Υποβάλετε το κύριο email εργασίας σας για να εντοπίσετε την καρτέλα σας.',
      'Ελέγξτε το email σας και κάντε κλικ στον σύνδεσμο επαλήθευσης ταυτότητας.',
      'Συμπληρώστε τη φόρμα για να ζητήσετε τη διαγραφή των τηλεφώνων και των επαγγελματικών σας στοιχείων.'
    ]
  },
  {
    id: 'rocketreach',
    name: 'RocketReach',
    domain: 'rocketreach.co',
    category: 'Recruitment & B2B',
    description: 'Direct contact finder and database mining system that combines profiles to guess personal email aliases and cell networks of employees.',
    description_el: 'Σύστημα εύρεσης προσωπικών στοιχείων επικοινωνίας και εξόρυξης δεδομένων που συνδυάζει προφίλ για να προβλέψει προσωπικά email και τηλέφωνα εργαζομένων.',
    sensitivity: 'High',
    difficulty: 'Medium',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://rocketreach.co/optout',
    regions: ['Global'],
    instructions: [
      'Query your personal profile at rocketreach.co.',
      'Copy your specific listing URL from your browser address bar.',
      'Navigate to their Opt-Out page listed above.',
      'Paste your copied link into their tool and authenticate via the verifier email.'
    ],
    instructions_el: [
      'Αναζητήστε το προφίλ σας στο rocketreach.co.',
      'Αντιγράψτε τη διεύθυνση URL της καταχώρισής σας από τη γραμμή διευθύνσεων.',
      'Μεταβείτε στη σελίδα Opt-Out της RocketReach που αναφέρεται παραπάνω.',
      'Επικολλήστε τον σύνδεσμο στο εργαλείο τους και επικυρώστε το αίτημα μέσω του email επιβεβαίωσης.'
    ]
  },
  {
    id: 'lusha',
    name: 'Lusha',
    domain: 'lusha.com',
    category: 'Recruitment & B2B',
    description: 'Enterprise contact mining extensions and databases scraping and matching individual phone registries, active emails, and careers.',
    description_el: 'Επέκταση εξόρυξης εταιρικών επαφών και βάση δεδομένων που συλλέγει και αντιστοιχίζει προσωπικά τηλέφωνα, ενεργά email και επαγγελματικά στοιχεία.',
    sensitivity: 'High',
    difficulty: 'Easy',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.lusha.com/opt-out-form/',
    regions: ['Global'],
    instructions: [
      'Open Lusha\'s dedicated GDPR Opt-Out form.',
      'Search for your name/email to identify active contact listings.',
      'Mark the selected data fields containing your private listings.',
      'Confirm the transaction to instantly remove your contact details.'
    ],
    instructions_el: [
      'Ανοίξτε την ειδική φόρμα εξαίρεσης (Opt-Out) GDPR της Lusha.',
      'Αναζητήστε το όνομά σας ή το email σας για να εντοπίσετε ενεργές καταχωρίσεις επαφών.',
      'Επιλέξτε τα πεδία δεδομένων που περιέχουν τις προσωπικές σας πληροφορίες.',
      'Επιβεβαιώστε την ενέργεια για να διαγράψετε άμεσα τα στοιχεία επικοινωνίας σας.'
    ]
  },

  // 3. FINANCIAL, CREDIT RATING, & RISK ASSESSMENT BROKERS (USER RESEARCH MATCHED)
  {
    id: 'tiresias',
    name: 'Tiresias SA (Τειρεσίας)',
    domain: 'tiresias.gr',
    category: 'Financial & Risk',
    description: 'Greece\'s primary administrative bank risk and payment solvency database. Stores credit ratings, default logs, foreclosure filings, and corporate debt metrics of Greek citizens.',
    description_el: 'Η κύρια βάση δεδομένων τραπεζικού κινδύνου και φερεγγυότητας πληρωμών στην Ελλάδα. Αποθηκεύει πιστοληπτική ικανότητα, αθετήσεις υποχρεώσεων και εταιρικά χρέη Ελλήνων πολιτών.',
    sensitivity: 'High',
    difficulty: 'Hard',
    optOutMethod: 'Mail/Phone',
    optOutUrl: 'https://www.tiresias.gr/gr/ypiresies-gia-idiotes/ypiresia-enimerosis-idioton/',
    regions: ['GR'],
    instructions: [
      'Tiresias details are highly sensitive. Under GDPR and Greek Law, you have a right of access, rectification, and erasure of inaccurate ratings.',
      'Visit the Tiresias Consumer Information / Customer Service office (Alamanas 2, Marousi, Greece) or call (+30) 210-3676700.',
      'Go to their portal above and download the official "Access / Correction / Erasure request form (Αίτηση Άσκησης Δικαιωμάτων)".',
      'Prepare a signed physical letter along with your state-issued ID and deliver it to their Greek compliance desk.'
    ],
    instructions_el: [
      'Τα στοιχεία του Τειρεσία είναι εξαιρετικά ευαίσθητα. Βάσει του GDPR και του ελληνικού νόμου, έχετε δικαίωμα πρόσβασης, διόρθωσης και διαγραφής ανακριβών αξιολογήσεων.',
      'Επισκεφθείτε το Γραφείο Εξυπηρέτησης Κοινού της Τειρεσίας (Αλαμάνας 2, Μαρούσι) ή καλέστε στο (+30) 210-3676700.',
      'Κατεβάστε την επίσημη "Αίτηση Άσκησης Δικαιωμάτων" από τον παραπάνω ιστότοπο.',
      'Προετοιμάστε μια υπογεγραμμένη επιστολή μαζί με αντίγραφο της ταυτότητάς σας και παραδώστε τη στο τμήμα συμμόρφωσης.'
    ]
  },
  {
    id: 'dunandbradstreet',
    name: 'Dun & Bradstreet (D&B)',
    domain: 'dnb.co.uk',
    category: 'Financial & Risk',
    description: 'Global financial and corporate risk credit assessor publishing commercial history profiles, asset data, and scoring records of business entities in Europe.',
    description_el: 'Παγκόσμιος αξιολογητής χρηματοοικονομικού κινδύνου που δημοσιεύει προφίλ εμπορικού ιστορικού, περιουσιακά στοιχεία και βαθμολογίες επιχειρήσεων στην Ευρώπη.',
    sensitivity: 'High',
    difficulty: 'Medium',
    optOutMethod: 'Both',
    optOutEmail: 'euprivacy@dnb.com',
    optOutUrl: 'https://www.dnb.co.uk/utility-pages/privacy-policy/gdpr-portal.html',
    regions: ['Global'],
    instructions: [
      'Access Dun & Bradstreet\'s dedicated European GDPR Portal.',
      'Submit a formal request to investigate and scrub any personal data points matching your identity.',
      'Alternatively, draft and send a GDPR erasure demand directly to euprivacy@dnb.com including copies of identifiers.'
    ],
    instructions_el: [
      'Μεταβείτε στην ειδική πύλη GDPR για την Ευρώπη της Dun & Bradstreet.',
      'Υποβάλετε επίσημο αίτημα για να ελέγξετε και να διαγράψετε τυχόν προσωπικά δεδομένα που αντιστοιχούν στην ταυτότητά σας.',
      'Εναλλακτικά, στείλτε ένα αίτημα διαγραφής GDPR απευθείας στο euprivacy@dnb.com συμπεριλαμβάνοντας τα στοιχεία σας.'
    ]
  },
  {
    id: 'experian',
    name: 'Experian',
    domain: 'experian.co.uk',
    category: 'Financial & Risk',
    description: 'Credit reporting agency and financial database compiler. Sells household wealth estimates, marketing indexes, and consumer profiles across Europe.',
    description_el: 'Οργανισμός αναφοράς πιστοληπτικής ικανότητας και χρηματοοικονομικών δεδομένων. Πουλά εκτιμήσεις εισοδήματος, λίστες μάρκετινγκ και καταναλωτικά προφίλ στην Ευρώπη.',
    sensitivity: 'High',
    difficulty: 'Medium',
    optOutMethod: 'Both',
    optOutEmail: 'optout@experian.com',
    optOutUrl: 'https://www.experian.co.uk/consumer/privacy-rights.html',
    regions: ['Global'],
    instructions: [
      'Ensure you are requesting suppression from Experian\'s marketing and analytics registries, not regulatory credit histories.',
      'E-mail optout@experian.com specifying your full details, asking for suppression from background targeting lists.',
      'State your request under EU GDPR Article 17 and Article 21 (Right to Object).'
    ],
    instructions_el: [
      'Βεβαιωθείτε ότι ζητάτε εξαίρεση από τα μητρώα μάρκετινγκ και αναλύσεων της Experian και όχι από το ρυθμιστικό πιστωτικό ιστορικό.',
      'Στείλτε email στο optout@experian.com ζητώντας αφαίρεση από τις λίστες στοχευμένου μάρκετινγκ.',
      'Δηλώστε το αίτημά σας βάσει των Άρθρων 17 και 21 του GDPR (Δικαίωμα εναντίωσης).'
    ]
  },
  {
    id: 'equifax',
    name: 'Equifax',
    domain: 'equifax.com',
    category: 'Financial & Risk',
    description: 'Multinational credit reporting giant collecting identification attributes, demographic trackers, and consumer solvency grades.',
    description_el: 'Πολυεθνικός γίγαντας αναφοράς πιστοληπτικής ικανότητας που συλλέγει στοιχεία ταυτοποίησης, δημογραφικά στοιχεία και βαθμολογίες φερεγγυότητας καταναλωτών.',
    sensitivity: 'High',
    difficulty: 'Hard',
    optOutMethod: 'Web Form',
    optOutUrl: 'https://www.equifax.co.uk/privacy.html',
    regions: ['Global'],
    instructions: [
      'Locate Equifax\'s European privacy rights dashboard.',
      'Submit an unlisting request using their digital GDPR consumer rights web form.',
      'Provide your historical contact points to guarantee suppression from promotional list licensing.'
    ],
    instructions_el: [
      'Εντοπίστε τον πίνακα δικαιωμάτων απορρήτου της Equifax για την Ευρώπη.',
      'Υποβάλετε αίτημα εξαίρεσης χρησιμοποιώντας την ψηφιακή φόρμα δικαιωμάτων καταναλωτή GDPR.',
      'Παράσχετε τα στοιχεία επικοινωνίας σας για να εγγυηθείτε την εξαίρεσή σας από την αδειοδότηση προωθητικών λιστών.'
    ]
  },
  {
    id: 'transunion',
    name: 'TransUnion',
    domain: 'transunion.com',
    category: 'Financial & Risk',
    description: 'Finance risk assessment agency compiling extensive consumer dossiers, debt ratings, and commercial background histories globally.',
    description_el: 'Οργανισμός αξιολόγησης χρηματοοικονομικού κινδύνου που συντάσσει εκτενείς φακέλους καταναλωτών, αξιολογήσεις χρεών και ιστορικό εμπορικού προφίλ παγκοσμίως.',
    sensitivity: 'High',
    difficulty: 'Medium',
    optOutMethod: 'Email',
    optOutEmail: 'privacy@transunion.com',
    regions: ['Global'],
    instructions: [
      'Draft an email request referencing your EU GDPR Article 17 rights.',
      'Send the request to privacy@transunion.com stating your active email aliases.',
      'Request exclusion from all demographic targeting directories and financial marketing matrices.'
    ],
    instructions_el: [
      'Συντάξτε ένα email διαγραφής αναφέροντας τα δικαιώματά σας βάσει του Άρθρου 17 (GDPR).',
      'Στείλτε το αίτημα στο privacy@transunion.com δηλώνοντας τις ενεργές διευθύνσεις email σας.',
      'Ζητήστε τον αποκλεισμό σας από όλους τους καταλόγους δημογραφικής στόχευσης και πίνακες χρηματοοικονομικού μάρκετινγκ.'
    ]
  }
];
