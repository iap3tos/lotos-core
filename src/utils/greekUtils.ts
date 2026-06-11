/**
 * Helper function to convert a Greek string to Uppercase while removing accents
 * (tonos/dialytika where applicable) from uppercase letters according to Greek orthography rules.
 */
export function toGreekUppercase(str: string | null | undefined): string {
  if (!str) return '';
  const upper = str.toUpperCase();
  
  const map: { [key: string]: string } = {
    'Ά': 'Α',
    'Έ': 'Ε',
    'Ή': 'Η',
    'Ί': 'Ι',
    'Ϊ': 'Ι',
    'Ό': 'Ο',
    'Ύ': 'Υ',
    'Ϋ': 'Υ',
    'Ώ': 'Ω',
  };
  
  return upper.replace(/[ΆΈΉΊΪΌΎΫΏ]/g, (char) => map[char] || char);
}

/**
 * Transliterates Greek characters to Latin (Greeklish) equivalents for database matching
 * with international brokers.
 */
export function transliterateGreek(str: string | null | undefined): string {
  if (!str) return '';
  
  const charMap: { [key: string]: string } = {
    'α': 'a', 'β': 'v', 'γ': 'g', 'δ': 'd', 'ε': 'e', 'ζ': 'z', 'η': 'i', 'θ': 'th', 'ι': 'i', 'κ': 'k', 'λ': 'l', 'μ': 'm', 'ν': 'n', 'ξ': 'x', 'ο': 'o', 'π': 'p', 'ρ': 'r', 'σ': 's', 'ς': 's', 'τ': 't', 'υ': 'y', 'φ': 'f', 'χ': 'ch', 'ψ': 'ps', 'ω': 'o',
    'Α': 'A', 'Β': 'V', 'Γ': 'G', 'Δ': 'D', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'I', 'Θ': 'Th', 'Ι': 'I', 'Κ': 'K', 'Λ': 'L', 'Μ': 'M', 'Ν': 'N', 'Ξ': 'X', 'Ο': 'O', 'Π': 'P', 'Ρ': 'R', 'Σ': 'S', 'Τ': 'T', 'Υ': 'Y', 'Φ': 'F', 'Χ': 'Ch', 'Ψ': 'Ps', 'Ω': 'O',
    'ά': 'a', 'έ': 'e', 'ή': 'i', 'ί': 'i', 'ό': 'o', 'ύ': 'y', 'ώ': 'o', 'ϊ': 'i', 'ϋ': 'y', 'ΐ': 'i', 'ΰ': 'y',
    'Ά': 'A', 'Έ': 'E', 'Ή': 'I', 'Ί': 'I', 'Ό': 'O', 'Ύ': 'Y', 'Ώ': 'O', 'Ϊ': 'I', 'Ϋ': 'Y'
  };

  let result = str;

  // Custom regex mapping for double character combinations
  const doubleMap: [RegExp, string][] = [
    [/μπ/g, 'b'],
    [/Μπ/g, 'B'],
    [/ΜΠ/g, 'B'],
    [/ντ/g, 'nt'],
    [/Ντ/g, 'Nt'],
    [/ΝΤ/g, 'NT'],
    [/γγ/g, 'ng'],
    [/Γγ/g, 'Ng'],
    [/ΓΓ/g, 'NG'],
    [/γχ/g, 'nch'],
    [/Γχ/g, 'Nch'],
    [/ΓΧ/g, 'NCH'],
    [/αυ/g, 'av'],
    [/Αυ/g, 'Av'],
    [/ΑΥ/g, 'AV'],
    [/ευ/g, 'ev'],
    [/Ευ/g, 'Ev'],
    [/ΕΥ/g, 'EV'],
    [/ου/g, 'ou'],
    [/Ου/g, 'Ou'],
    [/ΟΥ/g, 'OU'],
    [/τσι/g, 'tsi'],
    [/Τσι/g, 'Tsi'],
    [/ΤΣΙ/g, 'TSI'],
    [/τζ/g, 'tz'],
    [/Τζ/g, 'Tz'],
    [/ΤΖ/g, 'TZ']
  ];

  for (const [pattern, replacement] of doubleMap) {
    result = result.replace(pattern, replacement);
  }

  return result.split('').map(char => charMap[char] || char).join('');
}
