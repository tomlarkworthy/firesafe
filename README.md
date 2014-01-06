# Firesafe
by Tom Larkworthy and Alex Hunsley

Firesafe compiles heirarchical state machines (HSM) definitions into Firebase security rules. The Firesafe HSM language is expressive, and a super set of the Firebase security language. Adding consistent, concurrent, failsafe protocols to Firebase is now a whole lot simpler (e.g. cross-tree transaction).

Do you want webscale, data integrity and no upfront costs or server management? Firebase + Firesafe FTW

## Motivation

In multiplayer apps/games, people cheat. It's a loss of direct sales, AND the free loaders also deminish the fun for everyone else. Multiplayer games are webscale, which means the old solutions to data integrity and transactions don't work (e.g. RDMS). 

Firebase solved one problem of the cost of providing low latency persistent data storage to mobile and desktop games. It's the first scalable NoSQL hosted solution that didn't suck. It also provided an unorthodox security and transactions abstraction. Turns out that abstraction has enough purchase to do some really cool things not possible in many NoSQL environments. Unfortunately, properly configuring the security layer is extremely verbose and error prone.  

Proper data integrity is very important, especially when users have *something to gain*. A classic game exploit is the "item clone". In this exploit, a player gives an item to a friend, and yanks their connection to the game. Now, the player and the friend have the item. Various variations exist, some not even requireing a friend. The reason why many games are effected by the same type of bug is that a difficult technical issue lies behind the exploit. It is very had to enforce the semantics of a **cross user transaction**.

Firebase can solve this with a **two phase commit protocol**. Classic literature on 2 phase commits state it *can* become deadlocked. However, normal deadlock issues don't arrise in this case, because Firebase is a central authority, and clients state's are persistented on disconnect. Unfortunately, actually writing a two phase commit protocol in Firebase security rules is actually really hard and error prone, and the 2-phase commit protocol was one motivation for creating the Firesafe abstraction of Heirarchical State Machines (HSM) in Firebase.

However, while HSM will prevent silly mistakes, it still can't prevent high level protocol errors. We are currently connecting Firesafe to a theorem proover. One this is complete will we be able to **proove non-blocking properties and protocol invariants for arbitrary HSMs**. Our long term goal is to make "proovably secure, deadlock free, multi-user interactions" simple. 

##Writing Firebase Rules is hard

Did you know ".validation" don't fire when newData() is null? [1] This means enforcing the topology of a Firebase subtree can't be done in validation rules, as a user is able to "null" any subtree if they have write access. This is a problem in many Firebases online now ...

To enforce the state of a multi-state protocol, all logic has to be condensed into a single ".write" Firebase boolean expression

[1] https://groups.google.com/forum/#!topic/firebase-talk/TbCK_zHyghg

#The HSM Language

In Firesafe we provide the Heirarchical State Machines (HSM) language. A similar language (UML statecharts) is often used in protocol design. A machine is a set of states and a set of transitions between them. Each machine gets compiled down to a single, massive ".write" rule.

The language has a very natural graphical representation. To explain the language lets start with simple examples and build up to a two phase commit protocol for secure exchange of items between players. 

## Example: Shop

One common source of complaints and support headaches is buying items in-game. If it goes wrong players could lose currency, or, if it's exploitable, cheaters profit and devalue the currency. This is an accute problem if the currency is bought with real world money.

<doc/shop.png>

In a normal firebase setting user accounts are represented as wildcard ($user) childern of "users". By placing our state machine as a child of "$user", Firesafe will generate an state (and signal) variable as a child of any "$user" nodes. 

We create secure firesafe variables: gold, swords and water, at the same hierarchical level as the state machine. This indicates those variables values are protected by Firesafe. They can only ever be tampered with by a connected client *if* explicitly mentioned in a "guard" of "effect" clause of the machine.

In the shopping scenario a user has just a single state, "playing". New players won't have Firebase data initially, so the black circle represents the initialization. New clients cannot initialize their new user accounts to anything though (a source cheating). **Guard clauses (diamond) prevent transtions, unless the guard evaluates to true**. Guard and effect clauses are expressed as normal Firebase security expressions. In the shop case, the diagram forces clients to initialise their accounts with:

```
{
    state:"playing",
    gold:100,
    swords:0,
    water:0
}
```

Once a player is playing, they have two options in the shop, buying a sword or water. Both these transion are labelled, which indicated the client must state which signal they are useing. In this example we use a guard to ensure the player has enough gold to make a purchase and they do not exceed a maximum for the items (max(swords) 2, max(water) 20).

**Effect clauses denote post conditions of Firesafe variables, which must evaluate to true**. **Any Firesafe variable not mentioned in the effect will be locked**. So to buy a sword after initialization, a new player can update 
```
{
    signal:"BUY_SWORD",
    gold:90,
    swords:1
}
```
on their "/user/<username>" Firebase reference. The player *cannot* sneak in an update to "water" at the same time, as Firebase enforces no variable mentioned outside the effect clause can change.

The final digramatic feature worth mentioning is the unattached red arrow. Unattached arrows on a digram denote a *transition type*. **Transions only occur if their type clause evaluates to true, which commonly used to express permissions**. In the shop we only allow the owner of the user record to invoke transitions. The transition type in particular is an exellent building block for complex multi-user interactions, becuase you can easily express some transitions can only be performed by certain user roles.

* complete hsm source file  - https://TODO
* generated validation rules  - https://TODO

# Example: Item Trade

Sending items from one player to another is problematic in many games and applications. Firebase natively does not offer much help, as Firebase transactions occur only on a subtree. To exchange items across users, you need to transfer data between differnt data trees (a **cross-tree transtion**). Firebase's atomic transactions cannot express this case, so the trade must be broken down into several smaller transactions Firebase does support.

One background issue is that a user might disconnect at any time (possible deliberatly). One player disconnecting should not trap the other player in an unescapable state (a.k.a. **deadlock**).

A cross tree transaction should either 1. occur, or 2. error and rollback. For a trade, an important invariant is the total number of objects in the world do not change. Drawing inspiration from existing literature, we adapt a **2-phase commit protocol** using in the banking sector for distributed balance trades, to implement trade on Firebase.

Each user is either, IDLE, sending an item (TX) or receiving an item (RX). Furthermore, the one partner in the trade must acknowledge the others actions in a 2-phase commit, so some additional acknowledgement states are required (ACK_RX, ACK_TX).

Although both trading partners are both users, and thus running exactly the same state machine protocol, it is very difficult to visualise all the interactions without explicitly treating the reciever and sender as different state machines. Thus our first diagram is an aid to visualization. Each state is the product of both parties state. So an individual state of the joint diagram is the state of the sender (user A) & receiver (user B).

<send_item_left.png>

(guard and effect clauses have been lossy compressed for readability, see below for actual clauses)

Our protocol is split into several stages. First, the sender indicates he wants to send a specific item to a specific player, by sending the signal "SEND". They *must* move the item out of the item slot and into their tx slot used internally for the protocol  (for illatration we are sending "GOLD"). They indicate the receiving party in the tx_loc slot, which acts like a pointer to stop disinterested parties being involved.

```
{
    state: "TX",
    signal:"SEND",
    item:null,
    tx:"GOLD",
    tx_loc:"receiver"
}
```

Firesafe generates rules that will disallow the transition if the player has nothing to send, or if the target player does not exist, through the guard rules:

```
data.child('item') != null &&
root.child('users').child(newData.child('tx_loc').val()) != null",
```

Furthermore, the effect is that the value in item is transfered into tx by the effect clause

```
newData.child('tx').val() == data.child('item').val() &&
newData.child('tx_loc').val() != null"
```

Once a sender is trying to send to somebody, a receiver can transition into the RX state with:

```
{
    state:"RX",
    signal:"RECEIVE",
    rx:"GOLD",
    rx_loc:"sender"
}
```

The time we guard that the reciever has room to receive the item, and check the sender is in the right state, and pointing to the reciever. Note, we use Firebase's root var and the rx_loc pointer to navigate to the other users record to test conditions. 

```
data.child('item') == null &&
root.child('users').child(newData.child('rx_loc').val()).child('state').val() == "TX" &&
root.child('users').child(newData.child('rx_loc').val()).child('tx_loc').val() == $user",
```

The effect is that the rx_loc must match the sender, and the rx slot msut match the item being transferred.

```
newData.child('rx').val() == root.child('users').child(newData.child('rx_loc').val()).child('tx').val() &&
newData.child('rx_loc').val() != null"
```

Once the receiver is ready, the sender must acknowledge the status change of the reciever. Unlike previous transitions, *The sender changes the state state of the receiver*. To indicate the different roles within a state machine, we use different transtion_types:

```
".transition_types":{
    "self":"$user == auth.username",
    "other":"auth.username == data.child('rx_loc').val() || 
        auth.username == data.child('tx_loc').val()",
    "either":"$user == auth.username || 
        auth.username == data.child('rx_loc').val() || 
        auth.username == data.child('tx_loc').val()"
}
```

We have self, other and either transition types to indicate the transtion can be carried out by the owner user record, the other party in the trade, or either party. Thus, the transtion rule for sender acknowledgement on the receivers state machine is:

```
"ACK_RX":
{
    "from":"RX", 
    "to":"ACK_RX", 
    type:"other"
}"
```

The receiver does an ACK_TX similarly on the senders machine. Once both sender and receiver have ACKed. The transaction passes the point of no return.

Becuase either party could disconnect from Firebase at this point, we allow either party to commit the final stages of the transaction.

The sender null's their item slot and returns to IDLE, checking the other party is in the ACK_RX state (remember they are transitioning from ACK_TX too).

```
"COMMIT_TX":{"from":"ACK_TX", "to":"IDLE", type:"either",
    "guard":"
        root.child('users').child(data.child('tx_loc').val()).child('state').val() == 'ACK_RX'",
    "effect":"
        newData.child('item').val() == null &&
        newData.child('tx_loc').val() == null &&
        newData.child('tx').val() == null"
}
```

Finally the receiver transtions back to the IDLE state, but now with the item that was stored in the rx slot. Care has to be taken the COMMIT_RX is only possible after the COMMIT_TX is performed (see the gaurd).

```
"COMMIT_RX":{"from":"ACK_RX", "to":"IDLE", type:"either",
    "guard":"
        root.child('users').child(data.child('rx_loc').val()).child('state').val() != 'TX' &&
        root.child('users').child(data.child('rx_loc').val()).child('state').val() != 'ACK_TX'",
    "effect":"
        newData.child('item').val() == data.child('rx').val() &&
        newData.child('rx_loc').val() == null &&
        newData.child('rx').val() == null"
}
```

Additional rollback transtions are required so that either party can backout if one goes offline before the double ACK. Item states can be restored using the information in the tx and rx variables of the sender/receiver, but it adds little to discuss those transitions here.

* complete hsm source file  - https://TODO
* generated validation rules  - https://TODO

#Example: Hierarchical State Machines

So far the machines discussed are flat. If you have ever tried to use a finite state machine in a real world setting you might have found yourself replicating arrows until your diagram is a mess. Finite state machines suffer from *state space explotion*. Nesting states solves this issue and reuses states via an inheritance like mechanicsm. 

Miro Samek in the book "Practical UML Statecharts for C/C++" explains how to use state nesting, and explains common "patterns" for scalable state machine application. SLide 18 onwards of this online presentation explains why HSMs are so much better than FSMs in brief http://www.slideshare.net/quantum-leaps/qp-qm-overviewnotes

Note our HSM do not map directly onto UML. In particular, UML statecharts are deterministic, whereas firesafe's are not. In our HSM implementation, you do not need to specify signals at all, and leave the behaviour of the state chart ambiguous. While the behviour of firesafe is ambigious server side, the client still has to explicitly decide which states to move into. That decision is made by Javascript running in the browser, and often is not modelable by state machines. Hence non-deterministic hierarchical state machines are a better formalism for modeling serverside data integrity that deterministic ones. That said, much of Miro's material is applicable to Firesafe's formalism, and the "Practical UML Statecharts for C/C++" book is a throughly recommended resource (we are not in any way endorsed by either Miro Samek or Quantum Leaps, LLC). 

#Firesafe Status

### current
* .hsm -> firebase rules command line compiler complete

### under development
* time examples
* Formal protocol verification
* Draw.io -> .hsm converter

### on roadmap
* client side state machine generator

### Install with NPM

```
npm install -g firesafe
```

###  Run
```
firesafe <src_hsm> <dst_security_rules>
```






