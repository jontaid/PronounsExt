setup.first_upper = function(x) {
  return x[0]===x[0].toLocaleUpperCase();
};
setup.create_pronoun_dicts = function() {
  var pronoun_source_map = {
  // This maps
  // subject : [[ object, reflexive, adjective, possesive],
  //            [1st2nd3rd_person, sing/pl, verb sing/pl]]
  // 1st2nd3rd_person as 1-3, sing/pl as 1, 2 (sing, plural)
  // obj-possesive pronouns can be in xxx/m form
  // in which case xxx is to actual pronoun, but xxxm is used
  // to lookup to pronoun to find a replacement
  // (to provide a means of specifying ambiguous pronouns)
  // These should be in 'lowercase' form, first letter as uppercase
  // is automatically handled.
  "I": [["me", "myself", "my", "mine"], [1, 1, 1]],
  "you": [["you/m", "yourself", "your", "yours"], [2, 1, 2]],
  "she": [["her/m", "herself", "her", "hers"], [3, 1, 1]],
  "he": [["him", "himself", "his", "his/s"], [3, 1, 1]],
  "it": [["itm", "itself", "its", "its/s"], [3, 2, 1]],
  "we": [["us", "ourselves", "our", "ours"], [3, 2, 1]],
  "you": [["you/m", "yourselves", "your", "yours"], [3, 2, 1]],
  "they":[ ["them", "themselves", "their", "theirs"], [3, 2, 1]],
  }
  var pronoun_lookup = {};
  for (const [key, value] of Object.entries(pronoun_source_map)) {
    var other_pronoun_forms = value[0];
    other_pronoun_forms.unshift(key); // add subject pronoun
    var pronoun_attrs = value[1];
    for (var i=0; i<other_pronoun_forms.length; i++) {
    //for (const word of other_pronoun_forms) {
      var word = other_pronoun_forms[i];
      console.log(word);
      var lookup_word, result_word;
      if (word.contains("/")) {
        var split_word = word.split("/");
        lookup_word = (split_word[0]+split_word[1]);
        result_word = split_word[0];
      } else {
        lookup_word = word;
        result_word = word;
      }
      lookup_word = lookup_word.toLocaleUpperFirst();
      pronoun_lookup[lookup_word] = result_word;
      
    }
  }
  
  setup.pronoun_lookup = pronoun_lookup;
}();

setup.pronoun_handler = function() {
  var pronouns = {
    // 1-3: 1st, 2nd, 3rd person singular
    // 4-6: plural
    "I" : 1, 
    "You" : 2, 
    "He" : 3, 
    "She" : 3, 
    "It" : 3, 
    "We" : 4, 
    "You" : 5, 
    "They" : 6
    };
  console.log(setup.pronoun_lookup);
  var original = this.args[0];
  var new_pronoun = this.args[1];
  var new_pronoun_cap = setup.first_upper(new_pronoun);
  var replacement = original;
  var replacement = replacement.replace(/(\p{Alphabetic}+)([0-9]+)/gu,
    function(match, p1, p2){
      console.log(match);
      console.log(p1);
      var word = p1;
      var match_word = p1.toLocaleUpperFirst()
      if (pronouns[match_word]) {
        console.log(pronouns[match_word]);
      }
      return(new_pronoun);
    });
  this.output.append(replacement);
};
