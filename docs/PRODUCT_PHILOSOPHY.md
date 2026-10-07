# Swole Cat Product Philosophy

Swole Cat should feel like software made for people who actually want to train, not software designed to extract the maximum possible revenue from every session.

This document records the product principles that should survive feature growth, cloud infrastructure, Play Store distribution, and future monetization decisions.

## 1. Training comes first

The fastest path through Swole Cat should always be:

1. open the app
2. choose or resume a workout
3. log the work
4. know what to do next
5. finish with useful history

Features that make that loop slower, noisier, or harder to understand should earn their place.

## 2. The free app should be real software, not a demo

A free Swole Cat user should be able to meaningfully train with the app.

Core local workout functionality should remain available without requiring a paid plan, including the essential ability to create/use routines, log workouts, retain local history, and use the core training workflow.

The free experience should not be intentionally degraded with artificial limits whose only purpose is to pressure a purchase.

## 3. No ads

Swole Cat should not sell attention inside the workout experience.

No banner ads, interstitial ads, sponsored interruptions, or advertising inserted between sets.

The gym is already distracting enough.

## 4. No required recurring subscription

The intended product model is not "$8 every month forever."

The current target is:

**Swole Cat Pro: $7.99 one time, lifetime access.**

The exact price may change for future customers as the product and operating costs evolve, but the model should favor a simple one-time purchase whenever financially sustainable.

## 5. Lifetime means lifetime

If someone purchases Swole Cat Pro as a lifetime entitlement, that entitlement remains theirs.

Do not later convert that user into a recurring subscriber simply because the business model changes.

Early supporters should benefit from having supported the product early.

## 6. Pro should pay for real value and real cost

Paid features should make sense as paid features.

Good candidates include:
- cloud backup
- multi-device sync
- account recovery
- cloud-hosted share links or short codes
- group/connected features that require backend infrastructure
- selected advanced analytics or customization
- other features that create meaningful ongoing operating cost or clearly exceed the core local workout experience

The principle is not "everything cloud must be paid." The principle is that recurring infrastructure should have a sustainable funding path.

## 7. Keep local-first valuable

A user should not need Swole Cat servers to perform an ordinary workout.

Local-first architecture protects:
- speed
- offline use
- privacy
- resilience
- infrastructure cost
- the usefulness of the free product

Cloud should add convenience and connection, not become a mandatory dependency for basic training.

## 8. Expensive AI is a separate economic problem

Coach Swole Cat should continue to use local/deterministic intelligence wherever that produces a strong experience.

If future AI capabilities create meaningful per-request inference costs, do not quietly bundle unlimited expensive usage into a low-cost lifetime purchase that cannot sustain it.

Possible future approaches include optional usage credits or another clearly separated model.

This exception should not be used as an excuse to convert the ordinary Swole Cat workout product into a subscription.

## 9. Independence is part of the value proposition

A good description of the paid relationship is:

> Help keep Swole Cat independent, ad-free, and subscription-free.

People should feel that buying Pro gives them useful connected features and supports continued development, not that the app manufactured frustration until they paid.

## 10. Monetization should pass the gym-floor test

Before introducing a monetization decision, ask:

- Does this make the workout experience worse for a free user?
- Are we charging because the feature has real value/cost, or because we found somewhere to put a paywall?
- Would we be comfortable explaining the decision plainly to an early beta tester?
- Does it preserve the promise made to existing lifetime buyers?
- Does it keep Swole Cat fast, independent, and focused on training?

If the answer conflicts with those principles, the monetization design should change.

## Current commercial direction

The current intended model is:

- **Swole Cat Free:** a complete, useful local-first workout experience
- **Swole Cat Pro:** initially targeted at **$7.99 one time**
- **Pro entitlement:** lifetime for the purchasing user
- **Ads:** none
- **Required recurring subscription:** none
- **Future costly AI:** treated separately only if actual per-use economics require it

This is a product principle, not merely an introductory promotion.
