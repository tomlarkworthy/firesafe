% Firestate
% by Alex Hunsley
% Sunday, 22 December 2013 23:26:52 Greenwich Mean Time

Work in progress!

Firebase supports transactions via the locking of single nodes (including all child nodes) in the data tree.

#Writing Firebase Rules is hard

".validate" rule don't fire when newData is null, a cause of quite a data integrity problems


# Motivation

Modern online games are increasingly using NoSQL databases to track user data in a way that is massively scalable and affordable. Due to details of how locking/transactions are handled in NoSQL databases (compared to relational DBs), hacking and exploitation of NoSQL game databases is often possible.

# Why hack/exploit the games?
In some games players can have items in their inventory which have perceived worth. They might even be buyable or sellable for real currencies outside the game.

Examples of such items:

* a wooden axe (a discrete, indivisible item)
* a steel axe (a discrete, indivisible item)
* a potion (a discrete, indivisible item)
* a magic power (a discrete, indivisible item)
* gold coins (a continuous, divisible value)
* game points (a continuous, divisible value)

If such desirable items can be attained via hack/exploitation, someone will try it.

Games that allow transfer or purchase/exchange of game items between players are particularly prone to being exploited.

# Example of game transactions

## Single player

* player exchanges 10 gold coins for a wooden axe (e.g. in the game "shop") [-10gold +w.axe]
* player consumes a potion and gains a magical power [-potion +m.power]
* player spends 7 gold coins to upgrade a wooden axe to a steel axe [-7gold -w.axe +s.axe]

## Two players

* player A gives player B 5 gold coins [A:-5gold B:+5gold]
* player A gives player B a steel axe [A:-s.axe B:+s.axe]
* player A gives player B 7 gold coins in exchange for a potion [A:-7gold,+potion B:+7gold,-potion]
* player A gives player B 3 gold and a wooden axe in exchange for a steel axe

# How do the hacks happen?

* A malicious player can act as "hostile client" by submitting calls to the game web API that the legit game client code normally wouldn't. These calls might add, edit, remove or re-order parts of the data submitted.

Note that we can't assume that only one party to a game transaction is malicious: a malicious player might register two different user logins in the game, and exploit a flaw in the transfer/sale process between these two accounts. For example, they might find a way to "duplicate" a game item being transferred (so that the sender and receiver of a single item both end up with one of those items).


Child hacks game
http://www.bbc.co.uk/news/technology-14443001
78% of mobile apps have been hacked
http://www.esecurityplanet.com/mobile-security/78-percent-of-leading-android-ios-apps-have-been-hacked.html
(albiet I think that includes piracy)


## Scenario 1

Want to have atomic transfer of data X from one sub-tree S1 to another S2. We assume that X is publicly viewable information and not a secret that is readable only by S1. Therefore, the transfer of data X is denoting a change in ownership, and not any 'revelation' of X's contents.

S1 must permit and invite the transfer, S2 must agree. S2 can refuse the transfer, and S1 can cancel before
S2 has accepted (but not after).

After completion or cancelling, there must remain just one copy of the data and in a consistent state.

Constraints: 

* Firebase doesn't support moving of subtrees between sibling items.

* Locking of trees in transcations is possible but locking, for example, all users would be too granular

* Clients can be hostile - can throw any requests at the API they like for the validated user - must be secure against this attack

* Two clients engaged in a trade/transaction might be the same end-user trying to game the system

Tools at our disposal: 

* Transactions - only available on single items; too granular for the problem in general. Good for making a lock though.

* .read/.write rules and .validation (latter happens if former allow the op)

Example:

We have users.

#train notes to merge


Note somewhere that we're not dealing with Valuables being created/disposed of.

Valuable exchange inside one user account only - handleable using validations.
Tool for helping with this?
Could specify in a static fashion for validations e.g.:


    {
     "valuableItemDefs" : {
       "sword": { 
          "type":"discrete",
          "maxPerUser":"2",
          "minPerUser":"0"
       },
       "gold": { 
          "type":"int",
          "minPerUser":"0"
       },
       "water": { 
          "type":"continuous",
          "maxPerUser":"20",
          "minPerUser":"0"
       },
     },
     "conversions" : [
       {
         itemA : [10, "gold"],
         itemB : [1, "sword"],
         allowMultiples : "no" // can only exchange exact amounts given at any one tx
    
       },
       {
         itemA : [4, "gold"],
         itemB : [6, "water"],
         allowMultiples : "yes" // can exchange any multiples of each amount. Because one item
             // is 'int' type, we only allow int multiples 
       },
    }

A tool e.g. Python script then generates the validations to plug into Firebase.





 

# Appendix

http://robinverton.de/blog/2013/08/27/be-careful-when-going-client-only-firebase/

http://www.jsonschema.net/

* Application of FSM to game trading system in Erlang: http://learnyousomeerlang.com/finite-state-machines

* NuSMV is a model checker (checks certain things happen or don't happen in a concurrent FSM environment)

## Firebase details
* security rules - https://www.firebase.com/docs/security/security-rules.html
* rule expressions - https://www.firebase.com/docs/security/rule-expressions/index.html
* transactions - https://www.firebase.com/docs/transactions.html





