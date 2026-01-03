Twitter Handle:
    what if the user gave a twitter handle which doesn't exist in the database so it won't show error but it might be a typing mistake and that handle actually exist in real life so when calling Grok review on that handle, it will show the cards containing someone else tweets and likes

Battle Issue:
    what if one user pressed attack 2 times very quickly the nodejs will process these two creating a duplication, that why we will use "Atomic Query" we will find if the first user has his turn and if yes instantly update that now the turn is of second user so 2nd click will not go through as the first user turn is false