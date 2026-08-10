---
title: "What I Want for My Birthday"
featuredImage: "../images/birthday-nicolas-brulois-PvgV249iMFI-unsplash.jpg"
description: "A caregiver's case for taking metabolic, mitochondrial-targeted therapy seriously in glioblastoma research and treatment."
date: "2026-09-01"
category: "health"
related:
  - "Off the Chart: Candid Conversations in Health Care"
  - "Building a No Frills Meditation App"
  - "Building an AI Blog Editor with Claude Skills"
---

Taking a break from my usual tech/programming topics to cover something far more difficult. I recently celebrated a birthday, and with it came the usual question: What do you want for your birthday? This year, given everything that's happened, the answer that came to mind was far bigger than any gift. It belongs in the same category as "world peace" or "an end to poverty": enormous and far too vague for anyone to actually act on. So instead, I'm going to ask for something specific.

What I want is for more patients and caregivers facing cancer to hear about one idea: That cancer may have a metabolic dimension, maybe even a root cause that the genetic paradigm has missed, and this may be why cures built on genetics remain so elusive. In practice that means giving metabolic-targeted therapies a real look: knowing what's already shown safe today, and pushing for the rest to be properly tested.

"Cancer" is too big a word to build a case on. It's really hundreds of diseases, and the case for a metabolic root cause may be stronger for some than others. So I'll narrow to the one I've spent this year caregiving through: [glioblastoma](https://my.clevelandclinic.org/health/diseases/17032-glioblastoma).

<aside class="markdown-aside">
Nothing in this post should be considered medical advice. I'm a software engineer, not a doctor or a scientist. This is a personal story, what I've learned and experienced as a caregiver, not a treatment plan for anyone else.
</aside>

## A Year Ago

To explain why I'm asking for something so oddly specific (and not easy to wrap up with a bow), let me back up. A little over a year ago, someone I love suffered a [tonic-clonic seizure](https://www.mayoclinic.org/diseases-conditions/grand-mal-seizure/symptoms-causes/syc-20363458), lost consciousness, and was rushed to the emergency room. In a short span of time, we went from an ordinary life to hearing words I still have trouble writing down: glioblastoma, grade 4, the most aggressive kind of brain cancer there is.

The prognosis handed to us was about 12 - 15 months to live, with standard of care treatment (radiation + chemo). Some more grim numbers: Less than 30% of patients survive beyond 2 years, and only about 5% make it to the 5 year mark.

I have spent the year since as his caregiver. A grade 4 glioblastoma diagnosis is a particular kind of grief: someone you love is going to die in slow motion, as the tumour grows and presses in on the brain, preventing it from being able to perform functions we take for granted such as walking, talking, bathing, dressing, and eventually eating, swallowing, and breathing.

After the initial shock of the diagnosis wore off, a question kept turning over and over in my head. We hear about cancer breakthroughs in the news all the time. So how, in 2026, was glioblastoma still a death sentence? Why aren't more effective treatments available?

## The Idea I Remembered

I've listened to health and science podcasts for years. After the diagnosis, I recalled hearing Thomas Seyfried, a Ph.D. [professor and cancer researcher](https://www.bc.edu/bc-web/schools/morrissey/departments/biology/people/faculty-directory/thomas-seyfried.html) at Boston College, interviewed on the [Jesse Chapus podcast](https://youtu.be/g4EY9WWuSR8?si=CK0pa4HMSxMgQaBt), discussing his research into cancer, and glioblastoma specifically. What follows is a compilation of that interview, others of his I found afterward, conversations with other cancer researchers, and their papers.

Some terminology that comes up in this section:

- **Mitochondria:** tiny structures inside almost every cell that convert food into usable energy, often called the cell's power plant.
- **Cellular respiration:** the efficient way mitochondria make energy, using oxygen.
- **Glucose:** blood sugar, what carbohydrates break down into once eaten, and the body's primary fuel.
- **Fermentation:** a cruder, much less efficient backup way to make energy that doesn't depend on mitochondria working properly.
- **ROS (reactive oxygen species):** unstable byproduct molecules of energy production, think of them as exhaust, that can damage nearby DNA if they build up.
- **Ketosis:** a metabolic state where the body burns fat for fuel instead of sugar, producing ketones.

### Somatic Mutation Theory

Seyfried started by laying out the mainstream theory: cancer starts with mutations. Cells copy their DNA every time they divide, copying is imperfect, and over a lifetime errors can accumulate in genes that control growth. A mutation in an oncogene can jam the accelerator on; a mutation in a tumor suppressor gene can cut the brakes. The immune system normally catches and clears cells like this, but sometimes they evade detection, and a cell with both problems divides without limit, forming a tumor.

He then walked through what led him to question this theory. If DNA mutation really is the root cause of cancer, a few things should follow. Here's what he found instead:

1. **Cancer mutations should be specific to cancer cells.** Instead, the same mutations found in cancer cells also show up in healthy cells that never turn into tumors.
2. **The same cancer should be driven by the same mutations.** Instead, different patients with the same type of cancer often have different mutations from each other, and even different cells within a single patient's own tumor carry different mutations from one another.
3. **Swapping the DNA of a cancer cell should determine whether it behaves like cancer.** This is the one Seyfried leaned on hardest, and it's worth walking through carefully. A cell has two main compartments: the nucleus, which holds the DNA, and the cytoplasm surrounding it, which holds the mitochondria. In a series of [transfer experiments](https://pmc.ncbi.nlm.nih.gov/articles/PMC4493566/), researchers took the nucleus out of a cancer cell and put it into the cytoplasm of a normal cell, the one with healthy mitochondria. If mutated DNA were really driving the cancer, that cancer nucleus should have kept the cell malignant. Instead, malignancy was suppressed. Then they ran the experiment in reverse: a normal, healthy nucleus placed into a cancer cell's cytoplasm, mitochondria and all. If DNA were the cause, a clean nucleus should have fixed the cell. Instead, the cell stayed malignant. Both results point the same way: whatever is driving the cancer travels with the cytoplasm and its mitochondria, not with the nucleus and its DNA.

Another problem with the mutation theory is the money spent chasing it with comparatively little to show. In December 1971, Richard Nixon signed the [National Cancer Act](https://www.cancer.gov/about-nci/overview/history/national-cancer-act-1971), aka the "war on cancer." Since the 1980s, the genetic paradigm has absorbed most of a staggering sum spent on cancer research. Despite this, cancer deaths keep rising each year, even as headlines tout one "breakthrough" after another. Seyfried also points out that most of the reported decline in U.S. cancer deaths traces back to 1990s smoking-cessation campaigns rather than treatment breakthroughs.

<aside class="markdown-aside">
No single figure captures total cancer research spend. NIH alone has put roughly <a class="markdown-link" href="https://officeofbudget.od.nih.gov/approp_hist.html">$178.5 billion</a> into the National Cancer Institute (NCI) since 1971 (not inflation adjusted figure), and pharma spends more than <a class="markdown-link" href="https://pubmed.ncbi.nlm.nih.gov/39315831/">$80 billion a year</a> on oncology R&D, more than NCI's entire 54-year total, every single year. Global public and philanthropic funding adds another <a class="markdown-link" href="https://www.thelancet.com/journals/lanonc/article/PIIS1470-2045(23)00182-1/fulltext">$5.56 to $8.51 billion</a> annually (2006-2018).
</aside>

### Metabolic Theory of Cancer

Then the observation at the center of his work: nearly every cancer cell has defective mitochondria. Healthy cells run on cellular respiration, using oxygen to burn fuel efficiently, the way a well-tuned car engine burns gasoline. Cancer cells can't do that. Instead they fall back on fermentation, an older and much cruder way of generating energy, closer to a campfire than an engine: it works, but it wastes most of the fuel it burns to get a much smaller amount of usable energy out. That inefficiency is why cancer cells pull in many times more glucose than a healthy cell needs, even when oxygen is plentiful.

Fermentation is an older energy pathway, left over from before there was oxygen in the atmosphere, when all life was single-celled. Every cell today, however complex, still carries that ancestral code. The behavior that comes with it is the behavior of a single-celled organism: consume, divide, repeat, without restraint.

Under this model, carcinogens (smoking, asbestos, obesity, radiation, etc.) don't cause cancer by damaging DNA directly. The chain runs the other way, step by step:

1. A carcinogen damages a cell's mitochondria.
2. Damaged mitochondria can't generate enough energy through respiration, so the cell sends a stress signal to the nucleus.
3. That signal [switches on a set of genes](https://academic.oup.com/carcin/article/35/3/515/2463440) that turn on fermentation and drive unrestrained growth, the single-celled behavior described above.
4. Those same damaged mitochondria also leak extra reactive oxygen species (ROS), the "exhaust" that respiration normally keeps in check but that damaged mitochondria produce in excess.
5. Over time, the elevated ROS randomly damages nearby DNA.

This chain of events suggests that the DNA mutations observed in cancer cells are *downstream effects* of mitochondrial injury, *not the root cause*. Mitochondrial damage comes first and drives fermentation and growth directly through gene activation; the random DNA mutations are fallout from that, arriving later as a side effect of the exhaust the damaged mitochondria produce. This makes cancer a disease of energy metabolism, not a disease of genes.

<aside class="markdown-aside">
German biochemist Otto Warburg first documented <a class="markdown-link" href="https://www.nature.com/articles/nrc3038">cancer cells' abnormal fermentation</a> over a century ago. Some of his measurement tools were later found to be flawed, but his core call, mitochondrial dysfunction as cancer's origin, was <a class="markdown-link" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12170717/">directionally correct</a>.
</aside>

Why does the root cause matter? Because it determines where research money goes. If the mutations are downstream of a metabolic problem rather than the cause, that would explain why targeting them hasn't moved survival numbers much, and it points treatment somewhere else entirely.

### Ketogenic Metabolic Therapy

If the root problem is metabolic, then it follows that depriving the cancer of the fuel it depends on most could be an effective method of slowing it down. Cancer cells prefer glucose. Healthy cells, unlike cancer cells, can run efficiently on ketones, the fuel the body produces from fat when carbohydrate intake is low. Get the body into ketosis, burning fat for fuel instead of glucose, and you shift the fuel supply in a direction cancer cells can't use, but healthy cells can. For brain cancer, this is crucial because ketones can cross the blood-brain barrier, so the brain stays fuelled while the tumor is deprived.

Getting into ketosis for cancer management requires following a calorie-restricted ketogenic diet. This is very high fat (roughly 70-80% of calories), moderate protein, and carbohydrate held under 20 grams a day for most patients. There's also a biomarker for how deep the ketosis needs to be: the [Glucose Ketone Index](https://www.frontiersin.org/journals/science/articles/10.3389/fsci.2026.1763395/full) (GKI), a ratio of blood glucose to ketones. Research suggests holding it between 1 and 2 keeps the tumor fuel-starved while ketones stay high enough to fuel the rest of the body, and this range correlates with improved survival.

Diet alone isn't enough, because cancer has a backup fuel: glutamine, the most abundant amino acid in the body. You can't diet your way out of glutamine availability, since eliminating it would mean eliminating nearly all protein, which the body needs, and even then the body manufactures its own supply. So depriving cancer of both fuels takes more than diet alone; it's the basis for a combined strategy Seyfried calls [press-pulse](https://link.springer.com/article/10.1186/s12986-017-0178-2#Sec3), a sustained "press" on glucose through diet paired with periodic "pulses" that target glutamine directly, used intermittently.

Taken together, this diet + pulse + GKI monitoring protocol is referred to as *Ketogenic Metabolic Therapy* (KMT).

### Fasting Around Chemo

He also covered fasting timed to chemo: a day before, the day of, and a day after pushes the body into deeper ketosis around treatment. A [case series of 10 cancer patients](https://pmc.ncbi.nlm.nih.gov/articles/PMC2815756/) found nausea, vomiting, and fatigue were markedly reduced on chemo cycles paired with a short fast.

The same fasting protocol can also improve chemo's effectiveness, although this has only been shown in animals. A [glioma-specific animal study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3439413/) found that in starved glioma cells, a third of the usual dose of temozolomide (the standard chemo drug given to glioblastoma patients) killed as many cells as the full dose did in fed cells, and mice combining fasting with chemo and radiation survived far longer than those on standard treatment alone. Seyfried describes this as fasting "sensitizing" the cancer to chemo: it shifts healthy cells into a protective, low-growth state that cancer cells can't enter because their growth signals are stuck on.

### Management, Not Cure

He closes on a caveat: KMT isn't a cure for glioblastoma (or cancer more generally), but a way to manage it. He recommends using KMT as an adjunct, to extend overall survival with a higher quality of life.

What impressed me is these ideas did not come from a wellness influencer peddling supplements. They're from a cancer researcher, with decades of experience and peer-reviewed published research, discussing the exact disease we were facing.

<aside class="markdown-aside">
The explanations above are simplified to fit a blog post. For a deeper dive, Seyfried's <a class="markdown-link" href="https://academic.oup.com/carcin/article/35/3/515/2463440">Cancer as a Metabolic Disease</a> lays out the full mechanism, and <a class="markdown-link" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8467939/">this review</a> is a good starting point for how the metabolic and genetic theories stack up against each other.
</aside>

## Looking for a Clinician

When I suggested the idea of using KMT as an adjunct to my loved one (LO), he was hesitant. He has a deep respect for the person in the white coat, and was not comfortable doing something his doctors had not prescribed. He did however agree to a light-weight version: eliminating added sugar, and cutting back on starches such as bread, pasta, and rice in favour of more vegetables. That is a healthy change, although not sufficient to get into therapeutic ketosis. And it doesn't address the cancer's eventual adaptation to glutamine. That requires a medical approach.

This is the part the podcasts and papers don't cover. They lay out the biology and the trial data, but don't address some practical questions a patient might have such as "How do I get access to KMT?", "Is it covered by public or private insurance?".

From our searching in Canada, we couldn't find KMT being offered alongside standard of care. We did find private practitioners who could help with meal planning for a ketogenic diet, but that wasn't what my LO wanted. He needed this to come from inside conventional care, an oncologist or dietitian on his care team rather than a stranger found from an internet search.

## Standard of Care

So what does standard care offer for glioblastoma? Surgery to remove what can be removed, radiation for what remains, and chemotherapy for whatever is left. The problem is none of these entirely eliminate the cancer, and it always comes back, more aggressive than when it started.

The treatment itself carries real risk. Months after finishing radiation, my LO suffered a seizure so severe that he nearly stopped breathing. If not for the speed of the paramedics and the emergency team who got him intubated and into intensive care, he might not have survived. Further imaging revealed that radiation-induced inflammation had irritated the blood-brain barrier, triggering the seizure.

**The Cost of Fear**

I keep thinking about someone else, a woman I knew who was diagnosed with breast cancer. She was so afraid of the chemotherapy, the nausea, the vomiting, the sheer suffering of it, that she put off treatment. She has since passed away.

Imagine if part of standard care had been a way to make that treatment more bearable and more effective: guidance on KMT and water fasting around chemotherapy days to reduce the side effects and improve the results. She might have been able to face the treatment. She might still be here.

She didn't die because there was no cure. She died because the side effects were frightening enough that she chose to avoid treatment altogether. You don't need to accept any theory about the origins of cancer to see the problem: standard treatment is hard enough on the body that some patients walk away from it entirely.

## The Evidence for KMT

Let's turn to the existing evidence for metabolic therapy. The human studies are small. There are no completed large randomized controlled trials. But there is enough signal that should interest everyone who has a stake in improving glioblastoma outcomes.

<aside class="markdown-aside">
Some terminology when reading research papers: <strong class="markdown-strong">In vitro</strong>: in a dish. <strong class="markdown-strong">In vivo</strong>: in a living animal. <strong class="markdown-strong">OS</strong> (overall survival) and <strong class="markdown-strong">PFS</strong> (progression-free survival): standard trial measures, how long patients live, how long before the tumour regrows. <strong class="markdown-strong">QoL</strong>: quality of life. Research climbs a ladder: pre-clinical (cells, then mice), then human trials in phases: Phase 1 asks if it's safe, Phase 2 if it shows effective, Phase 3 is the large randomized trial that's the gold standard and gate to clinical practice.
</aside>

[Prospective study from Greece (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11876051/): followed 18 newly diagnosed glioblastoma patients and compared those who stuck to a ketogenic diet beyond six months against those who did not, alongside standard treatment. The diet-adherent group had a three-year survival rate of 66.7 percent, versus 8.3 percent in the non-adherent group, a statistically significant difference. Adherent patients lived from 33 months to more than 84, while non-adherent patients died at around 15.7 months, close to the historical average. Notably, all of the long-term survivors were IDH-wildtype, the harder-to-treat subtype. This was a small, non-randomized study, and patients chose whether to stick to the diet, so some of that gap could reflect that healthier or more motivated patients find it easier to adhere. That confound is real, but a gap this large in three-year survival is worth further investigation.

[Phase 1 safety trial (2025)](https://www.nature.com/articles/s41598-025-06675-6): tested a supervised ketogenic diet alongside standard chemoradiation in 17 newly diagnosed glioblastoma patients. The diet was safe, patients maintained ketosis, and median overall survival was 29.4 months, against a historical benchmark of roughly 15. This was a small, single-arm study with no direct statistical comparison, but the direction is striking.

[2022 study of 16 glioma patients](https://pmc.ncbi.nlm.nih.gov/articles/PMC9339381/): patients who maintained ketosis for an average of about 20 months reported, by standard neuro-oncology criteria, 8 complete and 8 partial responses, with one patient, who had a grade 3 anaplastic astrocytoma, maintaining ketosis for 36 months and showing complete resolution of the enhancing tumour on MRI.

[2024 case series from Colombia](https://athenaeumpub.com/wp-content/uploads/The-Effect-of-Ketogenic-Metabolic-Therapy-on-Recurrent-High-Grade-Gliomas-Case-Series.pdf): followed 29 patients with recurrent high-grade gliomas on ketogenic metabolic therapy. Among the roughly two-thirds who managed to stick with it, at 12 months 55 percent had stable disease and 20 percent a partial response, and the quality-of-life results were notable: seizure control improved in 95 percent and cognition in 80 percent, as reported by patients and their families.

[2024 case report](https://pmc.ncbi.nlm.nih.gov/articles/PMC10996027/): describes a 64-year-old woman with IDH-wildtype glioblastoma who used the ketogenic approach alongside full standard care. She remained stable for about two years, and then, after a period of stress and reduced adherence, the tumour progressed. It is a single case, but it illustrates the link between staying in the therapeutic range and disease control, done with standard care.

[Pair of pediatric case reports from 1995](https://pubmed.ncbi.nlm.nih.gov/7790697/): among the first human signals, within days of starting a ketogenic diet, PET scans showed roughly a 22 percent drop in glucose uptake at the tumour site, and one child then remained free of disease progression for a further 12 months.

[2022 feasibility study of 10 glioblastoma patients](https://pmc.ncbi.nlm.nih.gov/articles/PMC9586748/): a combined fasting and ketogenic strategy found feasible and safe, but it did not show a survival benefit. Median survival was about 13 months, in line with standard care, and the authors were careful to say you cannot draw survival conclusions from a case series this small.

The strongest form of the therapy, press-pulse, has so far only been tested in animals. In this [2018 mouse study](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2018.00091/full), researchers combined a ketogenic diet with a glutamine-targeting compound and hyperbaric oxygen. This outperformed standard chemotherapy on survival, without the toxicity.

As of this writing (2026), a [Phase 2 randomized controlled trial at UCSF](https://clinicaltrials.ucsf.edu/trial/NCT05708352) in San Francisco is enrolling 170 newly diagnosed glioblastoma patients, designed to test whether the ketogenic diet improves overall survival. And Cedars-Sinai in Los Angeles is running a multi-site randomized trial called [DIET2TREAT](https://www.cedars-sinai.org/discoveries/fasting-as-next-step-in-cancer-treatment.html). However, these test diet alone rather than the full protocol.

This [2024 meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC11011080/) found that dexamethasone, the steroid given to glioblastoma patients to control surgery and radiation-induced brain swelling, is associated with significantly reduced overall and progression-free survival. This tells us that standard care can carry hidden costs, and that keto-adaptation, which lowers the blood sugar that dexamethasone spikes, might mitigate some of them.

## Why It's Stuck

Imagine if the results from the Greece study mentioned above, small scale as they are, had been attributed to some new molecule that could be patented. In that case, surely a pharmaceutical company would be pouring in research funds and it would be written about in oncology journals.

This isn't hypothetical. In 2024, the FDA and Health Canada approved [vorasidenib](https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-vorasidenib-grade-2-astrocytoma-or-oligodendroglioma-susceptible-idh1-or-idh2-mutation), a drug that targets a specific IDH1/IDH2 mutation, found mostly in slower-growing, lower-grade gliomas (not glioblastoma). It costs nearly 40K USD per month (roughly 478,000 dollars a year) and is taken indefinitely, until progression or dose toxicity.

So why don't we hear more about metabolic therapy from conventional cancer care? Especially since research showing cancer has metabolic origins dates back to the 1920's.

The interventions here are, for the most part, not patentable. A diet cannot be patented. The drugs that show up in these protocols are mostly old and off-patent. Nutritional counselling is not a profit centre. So there is no pharmaceutical company that stands to earn the kind of return that justifies pouring billion into research.

When private markets fail to fund something that would serve the public good, that is precisely the situation where governments are supposed to step in. Here, at any meaningful scale, they have not. This leaves metabolic therapy stuck because it cannot cross a bridge that requires a profit motive to build.

To the extent patients and caregivers stumble onto metabolic therapy on their own, it leaves them wondering if more could be done, or running N-of-1 experiments on themselves with no supervision. More on this in the next section.

## Do It Yourself?

There is an obvious response to all of this: if metabolic therapy is so promising, why don't patients undertake the ketogenic diet their own? Thomas Seyfried, when asked on [The Diary of a CEO](https://youtu.be/kBm8Ho-_RXM?si=GTzlkXt57EryzkkV) podcast how this reaches people, leans toward a grassroots answer: patients educate themselves and ask their oncologists.

In practice, my LO and I hit a few walls, from the search for a clinician to the day-to-day of trying this ourselves:

**The white coat:** Bringing up something you read or heard online with your oncologist is intimidating. You're not a medical expert, and it can feel like second-guessing the person managing your care, especially soon after a diagnosis when everything already feels overwhelming. Most patients need support to have that conversation at all, let alone push it further on their own.

**Family and friends:** Celebration and food are inseparable, and the foods at the centre of nearly every gathering are exactly the wrong ones: cake and dessert, bread and rolls, mashed potatoes, sugary drinks, alcohol. When someone declines what they have always eaten, it invites questions. "Did your doctor tell you to do that?" "No, I read about it online." That answer earns skeptical looks. This creates friction at moments meant for joy and togetherness.

**The protocol is genuinely hard:** KMT is nothing like the keto of recipe blogs and keto desserts. It is not for weight loss. In fact for some patients losing weight is undesirable, so the diet has to include far more fat than anyone naturally cooks with, just to hold weight steady. And the protocol involves more than dieting. A few non obvious but critical details include:

- **Not everyone is a candidate:** Some conditions prevent the body from breaking down and using fat for fuel. For those patients ketosis is off the table entirely, and finding that out safely requires a clinician.
- **Getting the ratio right is its own discipline:** Ketogenic ratios (grams of fat to combined grams of protein and carbohydrate) aren't one-size-fits-all. The Greece study used ratios from 1.4:1 up to 2.5:1; a Colombian case series used 3:1 during active treatment, eased to 1.5:1 on rest days to keep it tolerable. Picking and holding the right one for a given patient's weight, treatment stage, and lab results is a research-informed calculation. Most patients will require purchasing a kitchen scale and weighing all ingredients in food preparation, to ensure adherence to strict macro targets.
- **The diet itself is a minefield of small errors:** Berries and nuts, despite having a reputation for being "keto friendly", actually contain a surprisingly high number of carbohydrates, for someone targeting less than 20 grams daily. Cottage cheese, which shows up in a lot of keto recipes, is high in protein and naturally occurring sugar (lactose). Protein is not a "free" food: eaten in excess, the body converts it to glucose through gluconeogenesis, which further feeds the tumour. Frequent snacking throughout the day, even on low carb foods, raises insulin and prevents the body from entering ketosis.
- **Water fasting, used to deepen ketosis around chemo days, carries its own risk:** If a patient's body fat is too low, blood glucose can drop further than intended, and hypoglycemia can trigger a seizure. This is an especially dangerous outcome for someone with a brain tumour already prone to seizures.
- **None of this works without daily monitoring:** Glucose and ketones need daily blood-meter checks, tracked against a target ratio (the GKI). Research points to a GKI between 1 and 2 (some studies go up to 3) as the range that puts the most pressure on the cancer, and simply cutting back on sugar and starchy carbs won't get you there. This isn't a habit patients discover and adopt themselves; it has to be part of a supervised protocol.
- **Monitoring has a recurring cost:** The meter itself is a one-time purchase, but glucose strips, ketone strips, and lancets are all single-use, and purchased separately. Someone also has to teach the patient how correctly and safely perform daily finger pricking. None of this is currently treated as a covered medical expense.
- **Diet alone doesn't finish the job:** Cancer's backup fuel, glutamine, cannot be dieted away: eliminating glutamine-containing foods would mean eliminating almost all protein, and even then the body manufactures its own supply. Bringing glutamine down requires a combination of aerobic and resistance exercise, and drugs that target glutamine metabolism directly. These must be dosed and monitored by a trained medical team because of their own toxicity risks.

A motivated patient may be able to scale some of these walls, but this is not entirely a do-it-yourself project. Just like no one would expect a patient to compound their own chemotherapy drugs in a home kitchen, or calibrate their own radiation machine. Similarly, metabolic therapy is a prescription that would be most effective folded into standard of care and done under medical supervision.

## What I'm Asking For

Circling back to my birthday ask. What I'm asking for is awareness. That patients and caregivers facing a diagnosis like this hear that this research exists, that ketogenic metabolic therapy has evidence behind it as an adjunct, and that it's worth raising with an oncology team. Beyond that:

**More research.** The studies so far are small, and the strongest version of the therapy, press-pulse, has only been tested in animals. Phase 3 trials, the kind rigorous enough to settle whether this belongs in standard care, are the missing piece.

**Wider access to supervision.** Trained clinicians who can run this safely, so it isn't limited to the patients resourceful enough to find their own way to it.

The payoff isn't only measured in survival months. A patient who isn't nauseated, who feels better, can keep working, keep contributing, and keep dignity intact.

I think of my loved one, of the woman with breast cancer too afraid of what standard treatment would do to her, and of everyone sitting in a waiting room right now about to hear the same words we did. For all these people, their families, their caregivers, I hope more of us find out whether the metabolic approach to cancer can give them more of the only thing that matters. I would give up every birthday gift for the rest of my life to see this happen.

If you want to go deeper, consider the following books:

- [Cancer as a Metabolic Disease](https://www.amazon.com/Cancer-Metabolic-Disease-Management-Prevention/dp/0470584920)
- [Tripping Over the Truth](https://www.amazon.com/Tripping-over-Truth-Overturning-Entrenched/dp/160358935X)
- [The Keto Code](https://www.amazon.com/Keto-Code-Comprehensive-Guide-Oncology/dp/0981582737)
- [Keto for Cancer](https://www.amazon.com/Keto-Cancer-Ketogenic-Metabolic-Nutritional/dp/1603587012)
