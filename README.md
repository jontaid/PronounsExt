# PronounExt
Copyright (c) 2021 Jonathon T. Aider (a pseudonym)

This is a pronouns extension for SugarCube 2 (tested with 2.23.1). The extension is released under the LGPLv3 license.

To use: Include the `pronouns.tw` and `pronoun_addon.js` in your SugarCube story (e.g. place in your source directory if compiling with TweeGo). Add an include line e.g. {{{<<include "PronounsInit">>}}} to your StoryInit passage to add the macros to your story. This extension will add a few functions and data structures to your `SugarCube.setup` object, so there is a small chance of a name clash. To view these instructions rendered, you can link to or include the "PronounsExtInfo" passage in your story.