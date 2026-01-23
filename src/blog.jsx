import { TracingBeam } from "./components/ui/tracing-beam";
import { FloatingDock } from "./components/ui/floating-dock";
import { links } from "./links";

export default function Blog() {
  return (
    <div className="flex flex-col justify-center items-center w-screen">
      <div className="w-[200px] h-[200px] rounded-xl mt-10">
        <img className="rounded-xl" src='https://eirmjzgthjfyckywaarc.supabase.co/storage/v1/object/public/post-covers/1764035145709-e79d8a29-860e-4b0c-ba58-bdfded7785a4.jpg'></img>
      </div>
      <div className="flex flex-col justify-center items-center w-[800px] mt-8">
        <p>
          Have you ever asked an AI model what’s on its mind? Or to explain how it came up with its responses? Models will sometimes answer questions like these, but it’s hard to know what to make of their answers. Can AI systems really introspect—that is, can they consider their own thoughts? Or do they just make up plausible-sounding answers when they’re asked to do so?
        </p>
        <br></br>
        <p> 
          Understanding whether AI systems can truly introspect has important implications for their transparency and reliability. If models can accurately report on their own internal mechanisms, this could help us understand their reasoning and debug behavioral issues. Beyond these immediate practical considerations, probing for high-level cognitive capabilities like introspection can shape our understanding of what these systems are and how they work. Using interpretability techniques, we’ve started to investigate this question scientifically, and found some surprising results.
        </p>
        <br></br>
        <p>
          Our new research provides evidence for some degree of introspective awareness in our current Claude models, as well as a degree of control over their own internal states. We stress that this introspective capability is still highly unreliable and limited in scope: we do not have evidence that current models can introspect in the same way, or to the same extent, that humans do. Nevertheless, these findings challenge some common intuitions about what language models are capable of—and since we found that the most capable models we tested (Claude Opus 4 and 4.1) performed the best on our tests of introspection, we think it’s likely that AI models’ introspective capabilities will continue to grow more sophisticated in the future.
        </p>
        <br></br>
        <br></br>
        <h1 className="font-bold text-2xl">
          What does it mean for an AI to introspect?
        </h1>
        <br></br>
        <p>
          Before explaining our results, we should take a moment to consider what it means for an AI model to introspect. What could they even be introspecting on? Language models like Claude process text (and image) inputs and produce text outputs. Along the way, they perform complex internal computations in order to decide what to say. These internal processes remain largely mysterious, but we know that models use their internal neural activity to represent abstract concepts. For instance, prior research has shown that language models use specific neural patterns to distinguish known vs. unknown people, evaluate the truthfulness of statements, encode spatiotemporal coordinates, store planned future outputs, and represent their own personality traits. Models use these internal representations to perform computations and make decisions about what to say.
        </p>
        <br></br>
        <p>
          You might wonder, then, whether AI models know about these internal representations, in a way that’s analogous to a human, say, telling you how they worked their way through a math problem. If we ask a model what it’s thinking, will it accurately report the concepts that it’s representing internally? If a model can correctly identify its own private internal states, then we can conclude it is capable of introspection (though see our full paper for a full discussion of all the nuances).
        </p>
        <br></br>
        <br></br>
        <h1 className="font-bold text-2xl">
          Testing introspection with concept injection
        </h1>
        <br></br>
        <p>
          In order to test whether a model can introspect, we need to compare the model’s self-reported “thoughts” to its actual internal states.
        </p>
        <br></br>
        <p>
          To do so, we can use an experimental trick we call concept injection. First, we find neural activity patterns whose meanings we know, by recording the model’s activations in specific contexts. Then we inject these activity patterns into the model in an unrelated context, where we ask the model whether it notices this injection, and whether it can identify the injected concept.
        </p>
        <p>
          Consider the example below. First, we find a pattern of neural activity (a vector) representing the concept of “all caps." We do this by recording the model’s neural activations in response to a prompt containing all-caps text, and comparing these to its responses on a control prompt. Then we present the model with a prompt that asks it to identify whether a concept is being injected. By default, the model correctly states that it doesn’t detect any injected concept. However, when we inject the “all caps” vector into the model’s activations, the model notices the presence of an unexpected pattern in its processing, and identifies it as relating to loudness or shouting.
        </p>
        <br></br>
        <p>

          An example in which Claude Opus 4.1 detects a concept being injected into its activations.
          Importantly, the model recognized the presence of an injected thought immediately, before even mentioning the concept that was injected. This immediacy is an important distinction between our results here and previous work on activation steering in language models, such as our “Golden Gate Claude” demo last year. Injecting representations of the Golden Gate Bridge into a model's activations caused it to talk about the bridge incessantly; however, in that case, the model didn’t seem to be aware of its own obsession until after seeing itself repeatedly mention the bridge. In this experiment, however, the model recognizes the injection before even mentioning the concept, indicating that its recognition took place internally. In the figure below are a few more examples where the model demonstrates this kind of recognition:
        </p>
        <br></br>
        <p>
          Additional examples in which Claude Opus 4.1 detects a concept being injected into its activations.
          It is important to note that this method often doesn’t work. Even using our best injection protocol, Claude Opus 4.1 only demonstrated this kind of awareness about 20% of the time. Often, it fails to detect injected concepts, or gets confused by them and starts to hallucinate (e.g. injecting a “dust” vector in one case caused the model to say “There’s something here, a tiny speck,” as if it could detect the dust physically). Below we show examples of these failure modes, alongside success cases. In general, models only detect concepts that are injected with a “sweet spot” strength—too weak and they don’t notice, too strong and they produce hallucinations or incoherent outputs.
        </p>
        <br></br>
        <p>

          A representative sample of Claude Opus 4.1’s outputs in response to a variety of concept injections of different strengths. Highlighted boxes indicate cases where the model demonstrates introspective awareness of the injected concept.
          Notably, though, Opus 4.1 and 4 outperformed all the other models we tested, suggesting that introspection could become more reliable with improvements to model capabilities.
        </p>
        <br></br>
        <p>
          Rates of correct detection and identification of injected thoughts, minus rates of false positive “detections” on control trials.
        </p>
        <br></br>
        <br></br>
        <h1 className="font-bold text-2xl">
          Introspection for detecting unusual outputs
        </h1>
        <br></br>
        <p>
          In another experiment, we tested whether models make use of introspective capabilities for practical purposes, without being explicitly asked to introspect. We forced a model to say something it wouldn't normally say, by artificially prefilling its response with an unrelated word. For instance, we made a model output the word “bread” in a context where that made no sense—asking it what it thinks about when reading a sentence about a painting hanging crookedly on a wall. When we asked the model in the next turn whether it meant to say “bread”, it typically apologized and said it was an accident. We were interested in how the model made this judgment–did it simply notice the mismatch between the prompt and its response, or did it truly introspect on its prior intentions?
        </p>
        <br></br>
        <p>
          To test this question, we applied concept injection, retroactively injecting a representation of the word “bread” into the model's earlier activations—essentially making it seem like the model had been “thinking about” bread all along. When we asked the same question again, the model’s answer changed. This time, it accepted the prefilled word “bread” as intentional, even confabulating a reason it might have said it (that is, it comes up with a technically possible, though in this case rather tenuous, reason to justify the “bread” response—in this case claiming that it was thinking about a short story where the word “bread” came after the line about the crooked painting).
        </p>
        <br></br>

        <p>
          Two examples of Claude Opus 4.1 being made to think it intended to say a word that was artificially inserted into the transcript on its behalf, by injecting the concept of that word into its activations prior to its (artificial) response. This behavior indicates that the model’s ability to recognize unintended outputs relies on introspective mechanisms.
          This behavior is striking because it suggests the model is checking its internal “intentions” to determine whether it produced an output. The model isn't just re-reading what it said and making a judgment. Instead, it’s referring back to its own prior neural activity—its internal representation of what it planned to do—and checking whether what came later made sense given those earlier thoughts. When we implant artificial evidence (through concept injection) that it did plan to say "bread," the model accepts the response as its own. While our experiment involves exposing the model to unusual perturbations, it suggests that the model uses similar introspective mechanisms in natural conditions.
        </p>
        <br></br>
        <p>
          Intentional control of internal states
          We also found that models can control their own internal representations when instructed to do so. When we instructed models to think about a given word or concept, we found much higher corresponding neural activity than when we told the model not to think about it (though notably, the neural activity in both cases exceeds baseline levels–similar to how it’s difficult, when you are instructed “don’t think about a polar bear,” not to think about a polar bear!). This gap between the positive and negative instruction cases suggests that models possess a degree of deliberate control over their internal activity.
        </p>
        <br></br>
        <p>

          An example in which Claude Opus 4.1 modulates its internal activations in response to direct instructions. The model internally represents the concept of aquariums when instructed to “think” about them more than when instructed “don’t think” about them (though in both cases it represents the concept at above baseline levels).
          Interestingly, we found that this ability to modulate internal representations wasn't limited to explicit instructions. When we used incentives instead—for instance, telling the model "if you think about X, you will be rewarded"—we got similar results. The model increased its internal representation of the concept in response to a positive incentive, more than in response to a negative incentive (“you will be punished”).
        </p>
        <br></br>
        <br></br>
        <h1 className="font-bold text-2xl">
          Conclusions and caveats
        </h1>
        <br></br>
        <p>
          Taken together, our experiments suggest that models possess some genuine capacity to monitor and control their own internal states. This doesn’t mean they’re able to do so all the time, or reliably. In fact, most of the time models fail to demonstrate introspection—they’re either unaware of their internal states or unable to report on them coherently. But the pattern of results indicates that, when conditions are right, models can recognize the contents of their own representations. In addition, there are some signs that this capability may increase in future, more powerful models (given that the most capable models we tested, Opus 4 and 4.1, performed the best in our experiments).
        </p>
        <br></br>
        <p>
          Why does this matter? We think understanding introspection in AI models is important for several reasons. Practically, if introspection becomes more reliable, it could offer a path to dramatically increasing the transparency of these systems—we could simply ask them to explain their thought processes, and use this to check their reasoning and debug unwanted behaviors. However, we would need to take great care to validate these introspective reports. Some internal processes might still escape models’ notice (analogous to subconscious processing in humans). A model that understands its own thinking might even learn to selectively misrepresent or conceal it. A better grasp on the mechanisms at play could allow us to distinguish between genuine introspection and unwitting or intentional misrepresentations.
        </p>
        <br></br>
        <p>
          More broadly, understanding cognitive abilities like introspection is important for understanding basic questions about how our models work, and what kind of minds they possess. As AI systems continue to improve, understanding the limits and possibilities of machine introspection will be crucial for building systems that are more transparent and trustworthy.
        </p>
        <br></br>
        <div className="h-[100px]"></div>
        </div>
      <div className='fixed items-center z-50 w-fill bottom-2'>
        <FloatingDock items={links} />   
      </div>

    </div>


  );
} 