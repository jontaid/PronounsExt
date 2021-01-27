setup.pronoun_debug = true;

// Enum to define the case of a word, either lower, upper or first letter upper
const WordCase = {
  LOWER : 1, 
  UPPER : 2, 
  UPPER_FIRST : 3
};
Object.freeze(WordCase)

// Returns WordCase for word
// WordCase.LOWER is defined as a word that ===word.toLowerCase()
// WordCase.UPPER_FIRST is defined as a single-letter word which is upper case
// OR a which has a first letter upper case and second letter lower case
// All other words will be WordCase.UPPER
setup.find_word_case = function(word) {
  if (word===word.toLowerCase()) {
    return WordCase.LOWER;
  }
  if (word[0]===word[0].toUpperCase()) {
    if (word.length==1 || word[1]===word[1].toLowerCase())
      return WordCase.UPPER_FIRST;
  }
  return WordCase.UPPER;
};

// Returns replacement with correct case (LOWER, UPPER or UPPER_FIRST)
// given case in original
setup.match_word_case = function(original, replacement) {
  var original_case = setup.find_word_case(original);
  if (original_case==WordCase.LOWER) return replacement.toLowerCase();
  if (original_case==WordCase.UPPER) return replacement.toUpperCase();
  return replacement.toLowerCase().toUpperFirst();
    // toUpperFirst() only converts first letter
}


setup.create_pronoun_tobe_dicts = function() {
  var pronoun_template = {
  // This maps subject_pronoun: [[other_pronounforms], [attributes]]
  // i.e.
  // subject : [[ object, reflexive, adjective, possesive],
  //            [1st2nd3rd_person, sing/pl, verb form]]
  // 1st2nd3rd_person as 1-3, sing/pl as 1, 2 (sing, plural)
  // verb form as 1 regular, 2 s form
  // obj-possesive pronouns can be in actual/umabiguous form
  // in which case 'actual' is the actual pronoun, but 
  // 'unambiguous' is an identifier used in the text to
  // unambiguously specify a certain type of pronoun when ambiguities exist
  // (to provide a means of specifying ambiguous pronouns)
  // These should be in 'lowercase' form, first letter as uppercase
  // is automatically handled.
  "I":        [["me",       "myself",    "my",        "mine"],        [1, 1, 1]],
  "you":      [["you/youm", "yourself",  "your",      "yours"],       [2, 1, 1]],
  "she":      [["her/herm", "herself",   "her",       "hers"],        [3, 1, 2]],
  "he":       [["him",      "himself",   "his",       "his/hiss"],    [3, 1, 2]],
  "it":       [["it/itm",   "itself",    "its",       "its/itss"],    [3, 1, 2]],
  "we":       [["us",       "ourselves", "our",       "ours"],        [1, 2, 1]],
  "you/yous": [["you/yousm","yourselves","your/yousr","yours/yousrs"],[2, 2, 1]],
  "they":     [["them",     "themselves","their",     "theirs"],      [3, 2, 1]],
  }

  // This is a set of lists of "to be" verbs
  // Each is [1st, 2nd, 3rd, plural]
  var tobe_word_sets = [
    ["am",           "are",     "is",    "are"],
    ["'m",           "'re",      "'s",   "'re"],
    ["am not/amn't", "aren't",  "isn't", "aren't"],
    ["was",          "were",    "was",   "were"],
    ["wasn't",       "weren't", "wasn't","weren't"],
    ["have",         "have",    "has",   "have"],
    ["'ve",          "'ve",     "'s/'hs","'ve"],
  ]

  // This gives a list of [regex, regex_replacement] to derive s-form verbs
  // from regular verbs
  // Checks are done in order so first match found is used, i.e. catch-all
  // should be last item in this list.
  var verb_replacement_sets = [
    [/(.*ch)/u, "$1es"],
    [/(.*sh)/u, "$1es"],
    [/(.*ss)/u, "$1es"],
    [/(.*l)f/u, "$1ves"],
    [/(.*i)fe/u, "$1ves"],
    [/(.*x)/u, "$1es"],
    [/(.*[aeiou]s)/u, "$1es"],
    [/(.*z)/u, "$1es"],
    [/(.*[aeiou]y)/u, "$1s"],
    [/(.*[^aeiou])y/u, "$1ies"],
    [/(.*[aeiou]o)/u, "$1s"],
    [/(.*[^aeiou])o/u, "$1oes"],
    [/(.*)/u, "$1s"],
  ]


  // This splits a template word given in above data structures to
  // return [actual, umambiguous] with umambiguous = actual in case of no /
  // unambiguous is also made to lowercase to provide case-insensitive lookup
  var split_template_word = function(word) {
    var umambig_word, actual_word;
    if (word.contains("/")) {
      var split_word = word.split("/");
      actual_word = split_word[0];
      umambig_word = split_word[1];
    } else {
      actual_word = word;
      umambig_word = word;
    }
    umambig_word = umambig_word.toLowerCase();
    return([actual_word, umambig_word])
  }

  var pronoun_source_lookup = {}; 
    // supply with a source pronoun, gives target type
  var pronoun_target_lookup = {}; 
    // supply with target_pronoun+type_index to give target pronoun

  var tobe_source_lookup = {};
    // supply with a source tobe word, gives tobe word set
  var tobe_target_lookup = {};
    // supply with target_pronoun, gives index of word to use in tobe word set
  
  var pronoun_attr_lookup = {};
    // supply with target_pronoun, gives attributes of this pronoun

  // Note that all keys in these lookup tables should be lower-case entirely.

  // Iterate pronoun template data struct
  // Fill in pronoun_source_lookup with umabiguous->[type, attrs]
  // Fill in pronoun_target_lookup with umabiguous+type->actual
  // To use these structs:
  //  Given a new unambiguous target pronoun class, and a unambiguous source pronoun
  //  Lookup type from pronoun_source_lookup
  //  Append type to target pronoun, lookup actual target pronoun
  //  e.g. Source text: *Yous* are here;  Target pronoun class: We
  //  Lookup Yous -> is type 0 (object pronoun for yous class)
  //  Lookup We0 -> actual is 'We'

  // Fill in tobe_source_lookup with umabiguous->[set]
  // Fill in tobe_target_lookup with umabiguous->tobe_form index
  //  where tobe_form index is 1, 2, 3 for 1-3rd person singular, 4 for plural
  // To use these structs:
  //  Given a new unambiguous target pronoun class, and a unambiguous source tobe
  //  Lookup [set] from tobe_source_lookup
  //  Lookup target tobe_form index from target pronoun
  //  e.g. Source text: I *am* here;  Target pronoun class: We
  //  Lookup am -> is ["am", "are", "is", "are"] (line 0)
  //  Lookup We -> is tobe_form index 4 (plural)
  //  Lookup [set][index-1] i.e. ["am", "are", "is", "are"][3]
  //    -> actual is 'are'

  for (const [key, value] of Object.entries(pronoun_template)) {
    if (setup.pronoun_debug)
      console.log(`Processing pronoun set ${key}...`);

    var other_pronoun_forms = [key, ...value[0]]; // add subject pronoun
    var pronoun_attrs = value[1];
    var [key_actual_word, key_umambig_word] = split_template_word(key);

    for (var i=0; i<other_pronoun_forms.length; i++) {
      // index within other_pronoun_forms gives type

      var pronoun_item = other_pronoun_forms[i];
      var [actual_word, umambig_word] = split_template_word(pronoun_item);
      if (setup.pronoun_debug)
        console.log(` Processing pronoun ${pronoun_item}...`);

      // fill source lookup with umabiguous->[type_index, ...attrs]
      var existing_value = pronoun_source_lookup[umambig_word];
      if (existing_value) {
        console.log(`Warning! Duplicate key in pronoun_source_lookup: ${umambig_word}`)
      }
      pronoun_source_lookup[umambig_word] = [i, ...pronoun_attrs];

      // fill target lookup with umabiguous+index->actual
      var target_key = key_umambig_word+i;
      existing_value = pronoun_target_lookup[target_key];
      if (existing_value && existing_value!=actual_word) {
        console.log(`Warning! Duplicate key in pronoun_target_lookup: ${target_key}`)
      }
      pronoun_target_lookup[target_key] = actual_word;
    }

    // fill tobe target lookup with umbiguous pronoun->tobe_form
    var person123 = pronoun_attrs[0];
    var singpl = pronoun_attrs[1]; 
    var tobe_form = person123;
    if (singpl==2) tobe_form = 4;
    existing_value = tobe_target_lookup[key_umambig_word];
    if (existing_value && existing_value!=tobe_form) {
      console.log(`Warning! Duplicate key in tobe_target_lookup: ${key_umambig_word}`)
    }
    tobe_target_lookup[key_umambig_word] = tobe_form;

    // fill pronoun attr lookup with umambiguous pronoun->attrs
    existing_value = pronoun_attr_lookup[key_umambig_word];
    if (existing_value && existing_value!==pronoun_attrs) {
      console.log(`Warning! Duplicate key in pronoun_attr_lookup: ${key_umambig_word}`)
    }
    pronoun_attr_lookup[key_umambig_word] = pronoun_attrs;
   
  }

  // fill tobe source lookup with umbiguous tobe word->tobe word set
  for (const tobe_word_set of tobe_word_sets) {
    if (setup.pronoun_debug)
      console.log(`Processing to be word set ${tobe_word_set}...`);

    for (const tobe_word of tobe_word_set) {
      if (setup.pronoun_debug)
        console.log(` Processing to be word ${tobe_word}...`);

      var [tobe_actual_word, tobe_umambig_word] = split_template_word(tobe_word);
      var existing_value = tobe_source_lookup[tobe_umambig_word];
      if (existing_value && existing_value!==tobe_word_set) {
        // there will be some replicated words (e.g. have),
        // but this is fine as long as they refer to the same word set
        console.log(`Warning! Duplicate key in tobe_source_lookup: ${tobe_word_source_key}`)
      }
      tobe_source_lookup[tobe_umambig_word] = tobe_word_set;

    }
  }
  setup.pronoun_source_lookup = pronoun_source_lookup;
  setup.pronoun_target_lookup = pronoun_target_lookup;
  setup.tobe_source_lookup = tobe_source_lookup;
  setup.tobe_target_lookup = tobe_target_lookup;
  setup.pronoun_attr_lookup = pronoun_attr_lookup;
  setup.verb_replacement_sets = verb_replacement_sets;

  if (setup.pronoun_debug) {
    console.log("Details of setup.pronoun_source_lookup:");
    console.log(setup.pronoun_source_lookup);
    console.log("Details of setup.pronoun_target_lookup:");
    console.log(setup.pronoun_target_lookup);
    console.log("Details of setup.tobe_source_lookup:");
    console.log(setup.tobe_source_lookup);
    console.log("Details of setup.tobe_target_lookup:");
    console.log(setup.tobe_target_lookup);
    console.log("Details of setup.pronoun_attr_lookup:");
    console.log(setup.pronoun_attr_lookup);
    console.log("Details of setup.verb_replacement_sets:");
    console.log(setup.verb_replacement_sets);
  }
}();

// Given an original (umambiguous) pronoun, find the correct replacement
// given the (umambiguous) target pronoun
// May return null if original is not a known pronoun
setup.find_pronoun_replacement = function(original, target_pronoun) {
  var lookup_original = original.toLowerCase();
  if (setup.pronoun_debug)
    console.log(` Looking up ${lookup_original} in pronoun_source_lookup...`);
  var source_result = setup.pronoun_source_lookup[lookup_original];
  if (source_result) {
    if (setup.pronoun_debug)
      console.log(`  Found: ${source_result}`);

    var target_lookup_key = target_pronoun+source_result[0];
    if (setup.pronoun_debug)
      console.log(`  Looking up: ${target_lookup_key} in pronoun_target_lookup...`);
    
    var target_result = setup.pronoun_target_lookup[target_lookup_key];
    if (!target_result) {
      console.log(`Warning: ${target_lookup_key} not in pronoun_target_lookup.`);
      return original;
    }
    var replacement = setup.match_word_case(original, target_result)
    if (setup.pronoun_debug)
      console.log(`  Found: ${target_result}; replacing ${original} with ${replacement}`);
    return replacement;
  } else {
    if (setup.pronoun_debug) console.log("  Not found.")
    return null;
  }
}

// Given an original (umambiguous) to be word, find the correct replacement
// given the (umambiguous) target pronoun
// May return null if original is not a known to be word
setup.find_tobe_replacement = function(original, target_pronoun) {
  var lookup_original = original.toLowerCase();
  if (setup.pronoun_debug)
    console.log(` Looking up ${lookup_original} in tobe_source_lookup...`);

  var source_result = setup.tobe_source_lookup[lookup_original];
  if (source_result) {
    if (setup.pronoun_debug)
      console.log(`  Found: ${source_result}`);

    var target_lookup_key = target_pronoun;
    if (setup.pronoun_debug)
      console.log(`  Looking up: ${target_lookup_key} in tobe_target_lookup...`);
    
    var target_result = setup.tobe_target_lookup[target_lookup_key];
    if (!target_result) {
      console.log(`Warning: ${target_lookup_key} not in tobe_target_lookup.`);
      return original;
    }
    
    // source_result is a set of to be words
    // target_result is 1-based index of word to use within this set
    // find actual target_word
    var target_word = source_result[target_result-1];

    var replacement = setup.match_word_case(original, target_word)
    if (setup.pronoun_debug)
      console.log(`  Found: ${target_result}; replacing ${original} with ${replacement}`);
    return replacement;
  } else {
    if (setup.pronoun_debug) console.log("  Not found.")
    return null;
  }
}

// Given an original verb, find the verb with in the correct form
// given the (umambiguous) target pronoun
// Assumes original verb is in regular form
// Will return original if cannot find a replacement
setup.find_verb_replacement = function(original, target_pronoun) {

  var target_attrs = setup.pronoun_attr_lookup[target_pronoun];
  if (!target_attrs) {
    console.log(`Warning: ${target_pronoun} not in pronoun_attr_lookup.`);
    return original;
  }

  var target_verb_form = target_attrs[2]; //1: regular, 2: s-form
  if (target_verb_form==1) {
    // assume original is regular form, not replacment needed
    if (setup.pronoun_debug)
      console.log(`${target_pronoun} has verb form ${target_verb_form}, not replacing.`);
    return original;
  }

  if (setup.pronoun_debug)
    console.log(`Checking ${original} for matches in verb_replacement_sets...`);
  for (const verb_replacement_set of setup.verb_replacement_sets) {
    var [verb_regex, verg_regex_replace] = verb_replacement_set;
    if (verb_regex.test(original)) {
      var replacement = original.replace(verb_regex, verg_regex_replace)
      if (setup.pronoun_debug)
        console.log(`  Found ${verb_regex} in ${original}, replacing with ${replacement}`);
      return replacement;
    }
  }
  if (setup.pronoun_debug)
    console.log(`${original} not found in any verb_replacement_sets, not replacing.`);
  return original;

}

setup.pronoun_handler = function() {
  var original = this.args[0];
  var new_pronoun = this.args[1].toLowerCase();
  //var new_pronoun_iscap = setup.find_word_case(new_pronoun);
  var new_text = original.replace(/(\p{Alphabetic}+)([0-9]+)/gu,
    function(match, p1, p2){
      if (setup.pronoun_debug)
        console.log(`Replacing ${match} (${p1}, ${p2})...`);
      var word = p1;
      var replacement;
      replacement = setup.find_pronoun_replacement(word, new_pronoun);
      if (replacement===null) {
        replacement = setup.find_tobe_replacement(word, new_pronoun);
        if (replacement===null) {
          replacement = setup.find_verb_replacement(word, new_pronoun);
          if (replacement===null) replacement = word;
        }
      } 

      return(replacement);
    });
  this.output.append(new_text);
};
