# Assignment 6: Wordle

## URL:

https://megler.github.io/wordle/

## API's Used:

- Word Picker: https://random-word-api.herokuapp.com/home
- Dictionary: https://dictionaryapi.dev/
- Confetti: https://github.com/catdad/canvas-confetti?tab=readme-ov-file

I was originally going to use RapidAPI but their payment portal was down and I had limited time to get the API implemented. After more searching, I found https://devpost.com/software/random-wordle-diqv1t which listed the 3 API's. No, I did not look at their final product or their GitHub repo. I only cared about workable API's.

The only drawback to the Word Picker is there are some really obscure words as well as words not recognized by the dictionary. This required more handling to generate a word, confirm it was in the dictionary, then allow the game to begin. They're all free, so can't really complain.

One note: If you put jibberish in as a guess, the dictionaryapi throws a 404. I checked the API itself and that's just how it behaves. Back to that free thing, but I am aware of it.

The confetti API is pretty cool. I enjoyed playing with it.

## Question

What was the most satisfying part of this assignment?

After having spent the past 2 weeks at work creating a complete frontend application (Angular) for large scale budgeting, I have to say Wordle was HARD. So many edge cases. Especially without having a framework to abstract out the hard stuff. It was very satisfying doing this the hard way and seeing it come together. Plus confetti is cool. ;-)

The other satisfying part was using portions of JS I never use in a framework. Promises (I use RXJS in real life) are the big one, but there were also interesting JS methods like `Array.isArray(result)` and `hasOwnProperty` which I haven't come across the need to use yet at work. They were super cool to use here.
