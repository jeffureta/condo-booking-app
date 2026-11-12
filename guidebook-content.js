/**
 * guidebook-content.js
 * In-Unit Digital Guest Guidebook & House Manual Domain Module
 * Serene Suite at Serin East Tagaytay (Unit 418)
 */

export const GUIDEBOOK_DATA = {
  property: {
    unit: 'Unit 418',
    building: 'Serin East Tagaytay',
    address: 'Unit 418 Serin East Tagaytay, Brgy. Silang Crossing East, Tagaytay City, Cavite',
    landmarks: 'Right beside Ayala Malls Serin and across Lourdes Church',
    checkin_time: '2:00 PM',
    checkout_time: '12:00 NN'
  },

  wifi: {
    id: 'wifi',
    title: 'High-Speed Wi-Fi',
    ssid: 'SereneSuite_418_Guest',
    password: 'TagaytayStaycation418!',
    instructions: 'Connect to the network and enter the password above. Fast 100Mbps connection suitable for streaming and remote work.',
    troubleshooting: [
      'If network is not visible, ensure your device Wi-Fi is turned off and back on.',
      'If internet drops, locate the fiber modem beside the TV cabinet and wait 30 seconds before power cycling.',
      'Contact host or caretaker if PON/LOS red light flashes.'
    ]
  },

  endorsement: {
    id: 'endorsement',
    title: 'Building Guest Endorsement',
    url: 'https://serineasttagaytayendorsement.carrd.co/',
    description: 'Mandatory building admin clearance for Serin East Tagaytay. Submit primary guest valid ID, companion names, and phone number prior to check-in.'
  },

  parking: {
    id: 'parking',
    title: 'Parking Information & Policies',
    tower_fee_php: 350,
    endorsement_rule: 'Covered tower parking is ₱350/night subject to advance admin endorsement. Vehicle make, model, and plate number must be submitted at least 24 hours prior to arrival.',
    street_parking_info: 'Free street parking is available along the designated perimeter in front of Serin East Tagaytay on a first-come, first-served basis.',
    mall_parking_info: 'Paid overnight parking is also available at the adjacent Ayala Malls Serin parking facility.'
  },

  building_rules: {
    id: 'building_rules',
    title: 'Condo Administration Rules & Amenities',
    pool_info: 'Swimming pool passes are available via the property management office. Standard guest pool rates apply per head (closed Mondays for sanitation). Swimwear required.',
    quiet_hours: 'Strict quiet hours are observed from 10:00 PM to 8:00 AM. Please keep TV and conversation volume respectful.',
    trash_disposal: 'Garbage disposal room is located near the service elevator on each floor. Please tie trash bags securely before disposing.',
    smoking_policy: 'Strictly NON-SMOKING inside the unit and balcony. Violations are subject to admin fines and forfeiture of security deposit.'
  },

  appliances: [
    {
      id: 'ac',
      name: 'Split-Type Air Conditioner',
      location: 'Living Area & Bedroom',
      steps: [
        'Use the remote mounted on the wall cradle.',
        'Press the POWER button once to turn ON.',
        'Set mode to COOL (snowflake icon).',
        'Recommended comfortable setting: 22°C to 24°C on AUTO fan speed.'
      ],
      troubleshooting: [
        'Ensure all balcony doors and windows are closed tightly for optimal cooling.',
        'If remote display is blank, check battery contacts or notify caretaker.',
        'Please turn OFF the AC whenever leaving the unit to conserve energy.'
      ]
    },
    {
      id: 'smart_tv',
      name: 'Android Smart TV & Netflix',
      location: 'Living Room Cabinet',
      steps: [
        'Turn on the TV using the remote control power button.',
        'Ensure the TV input source is set to Home/Android TV.',
        'Click the Netflix app or YouTube app on the home screen.',
        'Select the guest profile or use your personal login.'
      ],
      troubleshooting: [
        'Ensure TV is connected to SereneSuite_418_Guest Wi-Fi.',
        'If screen freezes, press and hold the power button for 5 seconds to restart Android TV.'
      ]
    },
    {
      id: 'induction_cooktop',
      name: 'Single Induction Cooker',
      location: 'Kitchen Counter',
      steps: [
        'Place an induction-compatible pan/pot (provided in the bottom cabinet) onto the circular cooking zone.',
        'Plug into the designated wall outlet.',
        'Press the ON/OFF sensor button.',
        'Select Function (Fry/Boil/Hotpot) and adjust wattage/temperature with +/- buttons.'
      ],
      troubleshooting: [
        'Induction cooker will beep and display E0 if no induction-compatible cookware is detected on the ceramic plate.',
        'Check child-lock button (press and hold lock icon for 3 seconds if panel is unresponsive).',
        'Always wipe spills immediately after the surface cools down.'
      ]
    },
    {
      id: 'water_heater',
      name: 'Instant Shower Water Heater',
      location: 'Bathroom Shower',
      steps: [
        'Turn on the main bathroom shower lever to start water flow.',
        'Turn the temperature dial clockwise from LOW to MED for warm water.',
        'Never operate without water flowing through the heater chamber.'
      ],
      troubleshooting: [
        'If water is lukewarm, reduce water flow rate slightly on the showerhead to allow heating chamber to warm the water.',
        'Check the ELCB breaker test button on the unit if LED indicator light does not illuminate.'
      ]
    },
    {
      id: 'microwave',
      name: 'Digital Microwave Oven',
      location: 'Kitchen Counter',
      steps: [
        'Place food in a microwave-safe container (no metal, foil, or gold-rimmed plates).',
        'Close door firmly, turn knob or press Quick Start (30s increments).',
        'Wait for beep before opening.'
      ],
      troubleshooting: [
        'Always cover food with a paper towel or microwave cover to prevent splattering.'
      ]
    }
  ],

  local_guide: [
    {
      name: 'Ayala Malls Serin',
      distance: '1-minute walk (adjacent)',
      category: 'Shopping & Dining',
      description: 'Supermarket, cinema, Starbucks, fast food, pharmacy, and retail stores right next door.'
    },
    {
      name: 'Our Lady of Lourdes Parish Church',
      distance: '3-minute walk (across Emilio Aguinaldo Hwy)',
      category: 'Worship',
      description: 'Iconic church offering daily and Sunday holy mass services.'
    },
    {
      name: 'Fora Mall Tagaytay',
      distance: '5-minute walk (Rotonda)',
      category: 'Shopping & Essentials',
      description: 'Supermarket, clinics, banks/ATMs, and transport terminal.'
    },
    {
      name: 'Tagaytay Bulalo & Ridge Dining',
      distance: '5 to 10-minute drive',
      category: 'Local Cuisine',
      description: 'Leslie’s, Balay Dako, and Mahogany Market Bulalo stalls along Tagaytay-Nasugbu Highway.'
    }
  ],

  emergency_contacts: {
    host_support: 'Primary Host (Jeff) via Booking Messenger / Mobile',
    caretaker: 'On-site Caretaker (available for staging, luggage assistance, and urgent repairs)',
    admin_security: 'Serin East Tagaytay Lobby Reception & Security Desk (24/7)'
  }
};

/**
 * Search the guidebook by text query across all sections and appliances.
 * @param {string} query
 * @returns {Array<object>}
 */
export function searchGuidebook(query) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];
  const tokens = q.split(/\s+/).filter(Boolean);

  const results = [];

  const matchesTokens = (corpus) => {
    const lower = corpus.toLowerCase();
    return tokens.every(t => lower.includes(t));
  };

  // 1. Search appliances
  for (const app of GUIDEBOOK_DATA.appliances) {
    const textCorpus = [
      app.name,
      app.location,
      app.steps.join(' '),
      app.troubleshooting.join(' ')
    ].join(' ');

    if (matchesTokens(textCorpus)) {
      results.push({
        type: 'appliance',
        id: app.id,
        title: app.name,
        details: app
      });
    }
  }

  // 2. Search parking
  const parkingCorpus = [
    GUIDEBOOK_DATA.parking.title,
    GUIDEBOOK_DATA.parking.endorsement_rule,
    GUIDEBOOK_DATA.parking.street_parking_info,
    GUIDEBOOK_DATA.parking.mall_parking_info,
    '350',
    'tower'
  ].join(' ');
  if (matchesTokens(parkingCorpus)) {
    results.push({
      type: 'policy',
      id: 'parking',
      title: GUIDEBOOK_DATA.parking.title,
      details: GUIDEBOOK_DATA.parking
    });
  }

  // 3. Search wifi
  const wifiCorpus = [
    GUIDEBOOK_DATA.wifi.title,
    GUIDEBOOK_DATA.wifi.ssid,
    GUIDEBOOK_DATA.wifi.instructions,
    GUIDEBOOK_DATA.wifi.troubleshooting.join(' ')
  ].join(' ');
  if (matchesTokens(wifiCorpus)) {
    results.push({
      type: 'wifi',
      id: 'wifi',
      title: GUIDEBOOK_DATA.wifi.title,
      details: GUIDEBOOK_DATA.wifi
    });
  }

  // 4. Search building rules
  const rulesCorpus = [
    GUIDEBOOK_DATA.building_rules.title,
    GUIDEBOOK_DATA.building_rules.pool_info,
    GUIDEBOOK_DATA.building_rules.quiet_hours,
    GUIDEBOOK_DATA.building_rules.trash_disposal,
    GUIDEBOOK_DATA.building_rules.smoking_policy
  ].join(' ');
  if (matchesTokens(rulesCorpus)) {
    results.push({
      type: 'rules',
      id: 'building_rules',
      title: GUIDEBOOK_DATA.building_rules.title,
      details: GUIDEBOOK_DATA.building_rules
    });
  }

  // 5. Search local guide
  for (const spot of GUIDEBOOK_DATA.local_guide) {
    const spotCorpus = [spot.name, spot.category, spot.description].join(' ');
    if (matchesTokens(spotCorpus)) {
      results.push({
        type: 'local',
        id: spot.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        title: spot.name,
        details: spot
      });
    }
  }

  return results;
}

/**
 * Retrieve a specific section by section key.
 * @param {string} sectionId
 * @returns {object|null}
 */
export function getGuidebookSection(sectionId) {
  if (!sectionId || typeof sectionId !== 'string') return null;
  const key = sectionId.toLowerCase();

  if (GUIDEBOOK_DATA[key]) {
    return GUIDEBOOK_DATA[key];
  }

  // Check in appliances array
  const app = GUIDEBOOK_DATA.appliances.find(a => a.id === key);
  if (app) return app;

  return null;
}
