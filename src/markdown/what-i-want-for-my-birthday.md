---
title: "What I Want for My Birthday"
featuredImage: "../images/birthday-nicolas-brulois-PvgV249iMFI-unsplash.jpg"
description: "If you're facing a cancer diagnosis, or caring for someone who is, cancer may have a metabolic root cause, and that could change how it's treated."
date: "2026-09-01"
category: "health"
related:
  - "Off the Chart: Candid Conversations in Health Care"
  - "Building a No Frills Meditation App"
  - "Building an AI Blog Editor with Claude Skills"
artifacts:
  - slug: "metabolic-theory-eli5"
    title: "The Metabolic Theory of Cancer"
    file: "metabolic-theory-eli5.html"
    creditText: "eli5 skill"
    creditUrl: "https://github.com/anthropics/claude-plugins-community/tree/main/eli5"
---

Taking a break from my usual tech/programming topics to cover something far more difficult. I recently celebrated a birthday, and with it came the usual question: What do you want for your birthday? This year, given everything that's happened, the answer wasn't something that could be wrapped.

What I want is for more patients and caregivers facing cancer to hear about one idea: That cancer may have a metabolic dimension, maybe even a root cause that the genetic paradigm has missed, and this may be why cures targeting DNA mutations remain elusive. Cancer is really hundreds of different diseases, and the case for a metabolic root cause may be stronger for some than others. So I'll narrow to the one I've spent this year caregiving through: [glioblastoma](https://my.clevelandclinic.org/health/diseases/17032-glioblastoma).

<aside class="markdown-aside">
Nothing in this post should be considered medical advice. I'm a software engineer, not a doctor or scientist. This is a personal story, what I've learned and experienced as a caregiver, not a treatment plan for anyone else.
</aside>

## A Year Ago

To explain why I'm asking for something so specific, let me back up. A little over a year ago, someone I love suffered a [seizure](https://www.mayoclinic.org/diseases-conditions/grand-mal-seizure/symptoms-causes/syc-20363458), lost consciousness, and was rushed to the emergency room. In a short span of time, we went from an ordinary life to hearing words I still have trouble writing down: glioblastoma, grade 4, the most aggressive kind of brain cancer there is.

The prognosis handed to us was about 12 - 15 months with standard of care treatment. Some more grim numbers: Less than 30% of patients survive beyond 2 years, and only about 5% make it to the 5 year mark. There is no cure.

I have spent the year since as his caregiver. A grade 4 glioblastoma diagnosis is a particular kind of grief: someone you love is going to die in slow motion, as the tumour grows and presses in on the brain, preventing it from being able to perform functions we take for granted such as walking, talking, and eventually breathing.

After the initial shock of the diagnosis wore off, a question kept turning over and over in my head. We hear about cancer breakthroughs in the news all the time. So how, in 2026, was glioblastoma still a death sentence? Why aren't more effective treatments available?

## The Idea I Remembered

I've listened to health and science podcasts for years. After the diagnosis, I recalled hearing Thomas Seyfried, a Ph.D. [professor and cancer researcher](https://www.bc.edu/bc-web/schools/morrissey/departments/biology/people/faculty-directory/thomas-seyfried.html) at Boston College, interviewed on the [Jesse Chappus podcast](https://youtu.be/g4EY9WWuSR8?si=CK0pa4HMSxMgQaBt), discussing his research into cancer, and glioblastoma specifically.

Some terminology that comes up in this section:

- **Mitochondria:** tiny structures inside almost every cell that convert food into usable energy.
- **Cellular respiration:** the efficient way mitochondria make energy, using a combination of glucose and oxygen.
- **Glucose:** blood sugar, what carbohydrates break down into once eaten, and the body's primary fuel.
- **Fermentation:** a less efficient way to make energy by converting glucose into lactic acid, without needing oxygen or working mitochondria.
- **ROS (reactive oxygen species):** unstable byproduct molecules of energy production, think of them as exhaust, that can damage nuclear DNA if they build up.
- **Ketosis:** a metabolic state where the body burns fat for fuel instead of glucose, producing ketones.

### Somatic Mutation Theory

Seyfried started by laying out the mainstream theory of cancer, which holds that it starts with DNA mutations. Cells copy their DNA every time they divide, copying is imperfect, and over a lifetime (and exposure to carcinogens) errors can accumulate in genes that control growth. A mutation in an oncogene can jam the accelerator on; a mutation in a tumor suppressor gene can cut the brakes. The immune system normally catches and clears cells like this, but sometimes they evade detection, and a cell with both problems divides without limit, forming a tumor.

He then walked through what led him to question this theory. If DNA mutations are the driving force behind cancer, a few things should follow:

1. **Cancer mutations should be specific to cancer cells.** Instead, the same mutations found in cancer cells also show up in healthy cells that never turn into tumors.
2. **The same cancer should be driven by the same mutations.** Instead, different patients with the same type of cancer often have different mutations from each other, and even different cells within a single patient's own tumor carry different mutations from one another.
3. **Swapping the DNA of a cancer cell should determine whether it behaves like cancer.** A cell has two main compartments: the nucleus, which holds the DNA, and the cytoplasm surrounding it, which holds the mitochondria. In a series of [transfer experiments](https://pmc.ncbi.nlm.nih.gov/articles/PMC4493566/), researchers took the nucleus out of a cancer cell and put it into the cytoplasm of a normal cell with healthy mitochondria. If mutated DNA were really driving the cancer, that cancer nucleus should have kept the cell malignant. Instead, malignancy was suppressed. Then they ran the experiment in reverse: a normal, healthy nucleus placed into a cancer cell's cytoplasm. If DNA were the cause, a clean nucleus should have fixed the cell. Instead, the cell stayed malignant. Both results point the same way: whatever is driving the cancer travels with the cytoplasm and its mitochondria, not with the nucleus and its DNA.

Another problem with the mutation theory is the money spent chasing it with relatively little to show. In December 1971, Richard Nixon signed the [National Cancer Act](https://www.cancer.gov/about-nci/overview/history/national-cancer-act-1971), aka the "war on cancer." Since then, a staggering sum has been spent on research. Despite this, Seyfried points out that U.S. cancer deaths keep climbing each year, even as headlines tout one "breakthrough" after another. He attributes most of the [reported decline](https://acsjournals.onlinelibrary.wiley.com/doi/full/10.3322/caac.70043) in the death rate to 1990s smoking-cessation campaigns rather than treatment breakthroughs.

<aside class="markdown-aside">
No single figure captures total cancer research spend. NIH (U.S. National Institutes of Health) has put about <a class="markdown-link" href="https://officeofbudget.od.nih.gov/approp_hist.html">$178.5 billion</a> into the National Cancer Institute (NCI) since 1971 (not inflation adjusted), while the pharmaceutical industry worldwide spends more than <a class="markdown-link" href="https://pubmed.ncbi.nlm.nih.gov/39315831/">$80 billion a year</a> on oncology R&D. Globally, public and philanthropic funders put <a class="markdown-link" href="https://www.thelancet.com/journals/lanonc/article/PIIS1470-2045(23)00182-1/fulltext">$24.5 billion</a> into cancer research from 2016 to 2020.
</aside>

### Metabolic Theory of Cancer

Seyfried then lays out an alternate hypothesis that better matches the observed behaviour of cancer cells: nearly every cancer cell has defective mitochondria. Healthy cells run on cellular respiration, using oxygen to burn fuel efficiently. Cancer cells can't do that. Instead they fall back on fermentation, a less efficient way of generating energy that burns through many times more glucose than a healthy cell needs, even when oxygen is plentiful.

This matters because fermentation isn't just a less efficient backup. It's an older pathway left over from before there was oxygen in the atmosphere, when most life was single-celled. Every cell today, however complex, still carries that ancestral code. Reverting to it brings back the behavior that came with it: consume, divide, repeat, without restraint, forming a tumour.

Under this model, carcinogens (smoking, asbestos, obesity, etc.) don't cause cancer by damaging DNA directly. Rather, the chain of events is:

1. A carcinogen damages a cell's mitochondria.
2. Damaged mitochondria can't generate enough energy through respiration, so the cell sends a stress signal to the nucleus.
3. That signal switches on a set of genes that turn on fermentation and drive unrestrained growth.
4. Those same damaged mitochondria also leak reactive oxygen species (ROS), the "exhaust" that respiration normally keeps in check but that damaged mitochondria produce in excess.
5. Over time, the elevated ROS randomly damages nuclear DNA.

This chain of events suggests that the DNA mutations observed in cancer cells are *downstream effects* of mitochondrial injury, rather than the *drivers* of cancer.

<aside class="markdown-aside">
German biochemist Otto Warburg first documented <a class="markdown-link" href="https://www.nature.com/articles/nrc3038">cancer cells' abnormal fermentation</a> over a century ago. Some of his measurement tools were later found to be flawed, but his core observation, mitochondrial dysfunction as cancer's origin, was <a class="markdown-link" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12170717/">directionally correct</a>.
</aside>

Understanding what's driving cancer matters because it changes where treatment should be aimed. If genetic mutations are downstream of a metabolic problem, that explains why targeting them hasn't moved survival numbers much, and points to targeting cancer metabolism.

### Ketogenic Metabolic Therapy

It follows that depriving the cancer of the fuel it depends on most could be an effective way to slow it down. Cancer cells prefer glucose. Healthy cells, unlike cancer cells, can run efficiently on ketones, the fuel the body produces from fat when carbohydrate intake is low. Get the body into ketosis, burning fat for fuel instead of glucose, and you shift the fuel supply in a direction cancer cells can't use, but healthy cells can. For brain cancer, this is crucial because ketones can cross the blood-brain barrier, so the brain stays fuelled while the tumor is deprived.

Getting into ketosis for cancer management requires following a ketogenic diet, sometimes calorie restricted (depending on patients' starting weight). This is very high fat (70-80% of calories), moderate protein, and carbohydrate held under 20 grams a day for most patients. There's also a biomarker for how deep the ketosis needs to be: the [Glucose Ketone Index](https://www.frontiersin.org/journals/science/articles/10.3389/fsci.2026.1763395/full) (GKI), a ratio of blood glucose to ketones. Research suggests holding it between 1 and 2 keeps the tumor fuel-starved while ketones stay high enough to fuel the rest of the body, and this range correlates with improved survival.

Diet alone isn't enough, because cancer has a backup fuel: glutamine, the most abundant amino acid in the body. You can't diet your way out of glutamine availability, since eliminating it would mean eliminating nearly all protein, which the body needs, and even then the body manufactures its own supply. That's the basis for a combined strategy Seyfried calls [press-pulse](https://link.springer.com/article/10.1186/s12986-017-0178-2): a sustained "press" on tumor metabolism through diet, paired with periodic "pulses" of drugs or procedures that intensify the stress on the cancer.

Taken together, this diet + pulse + GKI monitoring protocol is referred to as *Ketogenic Metabolic Therapy* (KMT).

<!-- artifact: metabolic-theory-eli5 -->

### Fasting Around Chemo

KMT can also be used to reduce chemo side effects, through fasting timed around treatment, pushing the body into deeper ketosis. A [case series](https://pmc.ncbi.nlm.nih.gov/articles/PMC2815756/) found nausea, vomiting, and fatigue were reduced on chemo cycles paired with a short fast.

The same fasting protocol can also improve chemo's effectiveness, although this has only been [studied in animals](https://pmc.ncbi.nlm.nih.gov/articles/PMC3439413/): starved glioma cells needed just a third of the usual dose of temozolomide (the standard chemo drug given to glioblastoma patients) to kill as many cells as the full dose did in fed cells. Mice that fasted around chemo, and separately mice that fasted around radiation, survived longer than those on standard treatment alone. Seyfried describes this as "sensitizing" the cancer to chemo: it shifts healthy cells into a protective, low-growth state that cancer cells can't enter because their growth signals are stuck on.

### Management, Not Cure

KMT isn't a cure for glioblastoma (or cancer more generally), but a way to manage it. Seyfried recommends using KMT as an adjunct, to extend overall survival and improve quality of life.

<aside class="markdown-aside">
The explanations above are simplified to fit a blog post. For a deeper dive, Seyfried's paper <a class="markdown-link" href="https://academic.oup.com/carcin/article/35/3/515/2463440">Cancer as a Metabolic Disease: Implications for Novel Therapeutics</a> lays out the full mechanism, and <a class="markdown-link" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8467939/">this review</a> is a good starting point for how the metabolic and genetic theories stack up against each other.
</aside>

What impressed me is these ideas did not come from a wellness influencer peddling supplements. They're from a cancer researcher, with decades of experience and peer-reviewed published research, discussing the exact disease we were facing.

## Looking for a Clinician

When I suggested the idea of using KMT as an adjunct to my loved one (LO), he was hesitant. He has a deep respect for the person in the white coat, and was not comfortable doing something his doctors had not prescribed. He did however agree to a light-weight version: eliminating added sugar, and cutting back on starches such as bread, pasta, and rice in favour of more vegetables. That is a healthy change, although not sufficient to get into therapeutic ketosis. And it doesn't address the cancer's eventual adaptation to glutamine. That requires a medical approach.

This is the part the podcasts and papers don't cover. They lay out the biology and the research, but don't address some practical questions a patient might have such as "How do I get access to KMT?", or "Is it covered by public or private insurance?".

From our searching in Canada, we couldn't find KMT being offered alongside standard of care in a cancer center. We did find private practitioners who could help with meal planning for a ketogenic diet, but that wasn't what my LO wanted. He needed this to come from inside conventional care, an oncologist or dietitian on his care team rather than a stranger found from an internet search.

## Standard of Care

No clinician offering KMT meant falling back on standard treatment alone. For glioblastoma this is surgery to remove what can be removed, radiation given together with chemotherapy, then chemotherapy alone for months after. The problem is none of these eliminate the cancer, and it always comes back, more aggressive than when it started. When it does, Avastin (bevacizumab), sometimes combined with another chemo drug, can [ease symptoms](https://www.nejm.org/doi/full/10.1056/NEJMoa1707358), but doesn't extend survival.

The treatment itself carries risk. Months after finishing radiation, my LO suffered a seizure so severe that he nearly stopped breathing. If not for the speed of the paramedics and the emergency team who got him intubated and into intensive care, he might not have survived. Further imaging revealed that radiation-induced inflammation had irritated the blood-brain barrier, triggering the seizure. He was also left with expressive aphasia (difficulty with word finding and communication), as a result of the seizure occurring near the part of the brain responsible for language.

**The Cost of Fear**

I keep thinking about someone else, a woman I knew who was diagnosed with breast cancer. She was so afraid of the treatment that she put it off. She has since passed away.

Imagine if part of standard care had been a way to make that treatment more bearable: guidance on KMT to reduce the side effects and maybe even improve the results. She might have been able to face the treatment. She might still be here.

She didn't die because there was no treatment. She died because the side effects were frightening enough that she chose to avoid it altogether.

<aside class="markdown-aside">
This is not an argument against radiation or standard treatment. Seyfried raises a separate, more speculative point: <a class="markdown-link" href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8585920/">animal research</a> suggests irradiated brain tissue becomes a more favorable environment for tumor regrowth, which may explain why glioblastoma recurrences after radiation are more aggressive. From this he argues there's a case for human trials comparing KMT plus low-dose chemo against standard chemo + radiation. That remains an open question, which would be useful to have answered to weigh radiation's tradeoffs in brain cancer.
</aside>

## Evidence for KMT

Let's turn to the existing evidence for metabolic therapy. The human studies are small, mostly single-arm, and compared against historical benchmarks rather than randomized controls, so treat the survival numbers below as promising signal rather than proof:

<aside class="markdown-aside">
If you plan to read the studies below, it helps to know how research typically progresses: lab/cell studies (<code>in vitro</code>) and animal studies (<code>in vivo</code>) <a class="markdown-link" href="https://www.fda.gov/patients/drug-development-process/step-2-preclinical-research">come first</a>, followed by <a class="markdown-link" href="https://www.fda.gov/patients/drug-development-process/step-3-clinical-research">human trials</a>, Phase 1 through 4, each phase testing on more people with more confidence.
</aside>

[Clinical study (2025)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11876051/): followed 18 newly diagnosed glioblastoma patients and compared those who stuck to a ketogenic diet beyond six months against those who did not, alongside standard treatment. The diet-adherent group had a three-year survival rate of 66.7 percent, versus 8.3 percent in the non-adherent group, a statistically significant difference. Adherent patients lived from 33 months to more than 84, while non-adherent patients died at around 15.7 months, close to the historical average. Patients chose whether to stick to the diet, so some of that gap could reflect that healthier or more motivated patients finding it easier to adhere. That confound is real, but a gap this large in three-year survival is worth further investigation.

[Phase 1 safety trial (2025)](https://www.nature.com/articles/s41598-025-06675-6): tested a supervised ketogenic diet alongside standard chemoradiation in 17 newly diagnosed glioblastoma patients. The diet was safe, patients maintained ketosis, and median overall survival was 29.4 months, against a historical benchmark of ~15.

[2022 study of 16 glioma patients](https://pmc.ncbi.nlm.nih.gov/articles/PMC9339381/): patients who maintained ketosis for an average of about 20 months had, based on MRI scans, 8 cases where the tumor fully disappeared and 8 cases where it shrank significantly, among these 16 patients, all also on standard treatment.

*Note:* Only 7 of the 16 patients had glioblastoma; the rest had lower-grade gliomas, which generally have better prognoses.

[2024 case series from Colombia](https://athenaeumpub.com/wp-content/uploads/The-Effect-of-Ketogenic-Metabolic-Therapy-on-Recurrent-High-Grade-Gliomas-Case-Series.pdf): followed 29 patients with recurrent high-grade gliomas on ketogenic metabolic therapy. Among the two-thirds who stuck with it, at 12 months 55 percent had their tumor stay the same size, 20 percent had it shrink (though not disappear), and 25 percent had it grow. Quality-of-life results were also notable: seizure control improved in 95 percent and cognition in 80 percent, as reported by patients and their families.

[2022 feasibility study of 10 glioblastoma patients](https://pmc.ncbi.nlm.nih.gov/articles/PMC9586748/): a combined fasting and ketogenic strategy found feasible and safe, but it did not show a survival benefit. Median survival was about 13 months, in line with standard care.

*Note:* Half the patients in this study had poor-prognosis disease (progression, inoperable tumors, or palliative status) that would've excluded them from most trials. Also most only started the metabolic strategy after finishing chemoradiation rather than overlapping it, while metabolic therapy theory argues best results come from starting before and maintaining during standard treatment.

The strongest form of the therapy, press-pulse, has so far only been tested in animals. In this [2018 mouse study](https://www.frontiersin.org/journals/nutrition/articles/10.3389/fnut.2018.00091/full), researchers combined a ketogenic diet with a glutamine-targeting compound and hyperbaric oxygen. This outperformed standard chemotherapy on survival, without the toxicity.

As of this writing (2026), a [Phase 2 randomized controlled trial](https://clinicaltrials.gov/study/NCT05708352) is enrolling 170 newly diagnosed glioblastoma patients to test whether the ketogenic diet improves overall survival. However, it tests diet alone rather than the full KMT protocol, and the intervention runs for 18 weeks, far shorter than the 12-36 month windows in the case series and cohort studies above where the survival and quality-of-life signal actually showed up.

This [2024 meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC11011080/) found that dexamethasone, the steroid given to glioblastoma patients to control surgery and radiation-induced brain swelling, is associated with significantly reduced overall and progression-free survival. This tells us that standard care can carry hidden costs, and raises the (unstudied) question of whether keto-adaptation, which lowers the blood sugar that dexamethasone spikes, might mitigate some of them.

## Why Haven't I Heard of This?

Given research into the metabolic origins of cancer goes all the way back to the 1920's, you may be wondering why you haven't heard of this before. A few things working against metabolic therapy reaching patients:

**Medicine is slow to adopt what it discovers:** For example, in 1847, [Ignaz Semmelweis](https://en.wikipedia.org/wiki/Ignaz_Semmelweis), a physician in Vienna, found that doctors washing their hands with chlorinated lime before delivering babies cut maternity-ward deaths from over 18% to around 2%. The medical establishment rejected his findings, and hand washing didn't become standard practice for decades.

**There's no one positioned to profit from proving it:** Imagine if the results from the studies, small scale as they are, had been attributed to a new molecule that could be patented. In that case, surely a pharmaceutical company would be pouring in research funds to bring it to market.

This isn't hypothetical. In 2024, the FDA and Health Canada approved [vorasidenib](https://www.fda.gov/drugs/resources-information-approved-drugs/fda-approves-vorasidenib-grade-2-astrocytoma-or-oligodendroglioma-susceptible-idh1-or-idh2-mutation), a drug that targets a specific IDH1 mutation, found mostly in slower-growing, lower-grade gliomas (not glioblastoma). It costs nearly 40K USD per month and is taken indefinitely, until progression or dose toxicity.

The interventions in metabolic therapy are not patentable. A diet cannot be patented. The drugs that show up in these protocols are mostly old and off-patent. Nutritional counselling is not a profit centre. So there is no pharmaceutical company that stands to earn the kind of return that justifies pouring billions into research.

When private markets fail to fund something that would serve the public good, that is precisely the situation where governments are supposed to step in. Here, at any meaningful scale, they have not. This leaves metabolic therapy stuck because it cannot cross a bridge that requires a profit motive to build.

To the extent patients and caregivers stumble onto metabolic therapy on their own, it leaves them wondering if more could be done, or running N-of-1 experiments on themselves with no supervision. More on this in the next section.

## Do It Yourself?

There is an obvious response to all of this: if metabolic therapy is so promising, why don't patients undertake the ketogenic diet their own? Thomas Seyfried, when asked on [The Diary of a CEO](https://youtu.be/kBm8Ho-_RXM?si=GTzlkXt57EryzkkV) podcast how this reaches people, leans toward a grassroots answer: patients educate themselves and ask their oncologists.

In practice, my LO and I encountered some challenges, from the search for a clinician to the day-to-day of trying this ourselves:

**The white coat:** Bringing up something you read or heard online with your oncologist is intimidating. You're not a medical expert, and it can feel like second-guessing the person managing your care, especially soon after a diagnosis when everything already feels overwhelming. Most patients need support to have that conversation at all, let alone push it further on their own.

**Family and friends:** Celebration and food are inseparable, and these foods are usually incompatible with keto: cake and dessert, bread and rolls, mashed potatoes, sugary drinks, alcohol. When someone declines what they have always eaten, it invites questions. "Did your doctor tell you to do that?" "No, I read about it online." That answer earns skeptical looks. This creates friction at moments meant for joy and togetherness.

**The protocol is hard:** KMT is nothing like the keto of recipe blogs. It is not for weight loss. In fact for some patients losing weight is undesirable, so the diet has to include far more fat than anyone naturally cooks with, just to hold weight steady. And the protocol involves more than dieting. Here are just a few critical details:

- **Not everyone is a candidate:** Some conditions prevent the body from breaking down and using fat for fuel. For those patients ketosis is off the table entirely, and finding that out safely requires a clinician.
- **Getting the ratio right is its own discipline:** Ketogenic ratios (grams of fat to combined grams of protein and carbohydrate) aren't one-size-fits-all. Different studies use different ratios, and picking and holding the right one for a given patient's weight, treatment stage, and lab results is a research-informed calculation.
- **The diet itself is a minefield of small errors:** Berries and nuts, despite having a reputation for being "keto friendly", actually contain a high number of carbohydrates, for someone targeting less than 20 grams daily. Cottage cheese, which shows up in a lot of keto recipes, is high in protein and naturally occurring sugar (lactose). Protein is not a "free" food: eaten in excess, the body converts it to glucose through gluconeogenesis, which further fuels the tumour.
- **Water fasting, used to deepen ketosis around chemo days, carries its own risk:** If a patient's body fat is too low, blood glucose can drop further than intended, without ketones getting high enough, and can trigger a seizure. This is an especially dangerous outcome for someone with a brain tumour already prone to seizures.
- **Daily Monitoring:** Glucose and ketones need daily blood-meter checks, tracked against a target ratio (the GKI). Research points to a GKI between 1 and 2 (some studies go up to 3) as the range that puts the most pressure on the cancer, and simply cutting back on sugar and starchy carbs won't get you there. This requires purchasing a blood meter, a one-time cost, but glucose strips, ketone strips, and lancets are all single-use and purchased separately, and none of it is currently treated as a covered medical expense.
- **Diet alone doesn't finish the job:** Glutamine, as mentioned earlier in this post, is the sticking point here too. Bringing it down requires a combination of aerobic and resistance exercise, and drugs that target glutamine metabolism directly. These must be dosed and monitored by a trained medical team because of their own toxicity risks.

A motivated patient may be able to get over some of these hurdles, but this is not entirely a do-it-yourself project. Just like no one would expect a patient to compound their own chemotherapy drugs in a home kitchen, or calibrate their own radiation machine. Similarly, metabolic therapy is a prescription that would be most effective folded into standard of care and done under medical supervision.

## What I'm Asking For

Circling back to my birthday ask. What I'm asking for is awareness. That patients and caregivers hear that ketogenic metabolic therapy has evidence as an adjunct, and that it's worth raising with an oncology team. Beyond that:

**More research:** The studies so far are small, and the strongest version of the therapy has only been tested in animals. Phase 3 trials, the kind rigorous enough to settle whether this belongs in standard care, are the missing piece.

**Wider access:** Trained clinicians who can run this safely, so it isn't limited to the patients resourceful enough to find their own way to it.

The payoff isn't only measured in survival months; it's also quality of life. A patient who isn't nauseated, who feels good, can keep working, keep contributing, and keep their dignity intact.

I think of my loved one, of the woman with breast cancer too afraid of what standard treatment would do to her, and of everyone sitting in a waiting room right now about to hear the same words we did. For all these people, their families, their caregivers, I hope more of us find out whether the metabolic approach to cancer can give us more of the only thing that matters. I would give up every birthday gift for the rest of my life to see this happen.

If you want to go deeper, Seyfried's book [Cancer as a Metabolic Disease](https://www.amazon.com/Cancer-Metabolic-Disease-Management-Prevention/dp/0470584920) covers the theory, and the book [Keto for Cancer](https://www.amazon.com/Keto-Cancer-Ketogenic-Metabolic-Nutritional/dp/1603587012) covers the practical implementation.
