setup.first_upper = function(x) {
  return x[0]===x[0].toLocaleUpperCase();
};
setup.create_pronoun_dicts = function() {
  var pronoun_template = {
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
  "it": [["it/m", "itself", "its", "its/s"], [3, 2, 1]],
  "we": [["us", "ourselves", "our", "ours"], [3, 2, 1]],
  "you/s": [["you/sm", "yourselves", "your/p", "yours/p"], [3, 2, 1]],
  "they":[ ["them", "themselves", "their", "theirs"], [3, 2, 1]],
  }

  var split_lookup_result = function(word) {
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
    return([lookup_word, result_word])
  }

  var pronoun_source_lookup = {}; 
    // supply with a source pronoun, gives target type
  var pronoun_target_lookup = {}; 
    // supply with Target_pronoun+type_index to give target pronoun
    // note first letter should be capitalised

  for (const [key, value] of Object.entries(pronoun_template)) {
    var other_pronoun_forms = [key, ...value[0]]; // add subject pronoun
    var pronoun_attrs = value[1];
    var split_key = split_lookup_result(key);
    var key_lookup_word = split_key[0];
    var key_result_word = split_key[1];
    for (var i=0; i<other_pronoun_forms.length; i++) {
    //for (const word of other_pronoun_forms) {
      var word = other_pronoun_forms[i];
      var split_word = split_lookup_result(word);
      var lookup_word = split_word[0];
      var result_word = split_word[1];
        console.log(word);
      if (pronoun_source_lookup[lookup_word]) {
        console.log("Warning replacing source pronoun: "+lookup_word)
      }
      pronoun_source_lookup[lookup_word] = [i, ...pronoun_attrs];
        // result is lookup_word : [type_index, ...attrs]
      var target_key = key_lookup_word+i;
      if (pronoun_target_lookup[target_key]) {
        console.log("Warning replacing source pronoun: "+target_key)
      }
      pronoun_target_lookup[target_key] = result_word;
      
    }
  }
  
  setup.pronoun_source_lookup = pronoun_source_lookup;
  setup.pronoun_target_lookup = pronoun_target_lookup;
}();

setup.pronoun_handler = function() {
  console.log(setup.pronoun_source_lookup);
  console.log(setup.pronoun_target_lookup);
  var original = this.args[0];
  var new_pronoun = this.args[1].toLocaleUpperFirst();
  //var new_pronoun_iscap = setup.first_upper(new_pronoun);
  var replacement = original;
  var replacement = replacement.replace(/(\p{Alphabetic}+)([0-9]+)/gu,
    function(match, p1, p2){
      var result = p1;
      console.log(match);
      console.log(p1);
      var word = p1;
      var match_word = word.toLocaleUpperFirst()
      console.log(match_word);
      if (setup.pronoun_source_lookup[match_word]) {
        console.log(setup.pronoun_source_lookup[match_word]);
        var source_result = setup.pronoun_source_lookup[match_word];
        var target_lookup_key = new_pronoun+source_result[0];
        console.log(target_lookup_key)
        console.log(setup.pronoun_target_lookup[target_lookup_key]);  
        result = setup.pronoun_target_lookup[target_lookup_key];
        if (setup.first_upper(word)) result = result.toLocaleUpperFirst();
      }

      return(result);
    });
  this.output.append(replacement);
};
