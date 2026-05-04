document.addEventListener("DOMContentLoaded", () => {
  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach((question) => {
    question.addEventListener("click", () => {
      const isExpanded = question.getAttribute("aria-expanded") === "true";
      const answerId = question.getAttribute("aria-controls");
      const answer = document.getElementById(answerId);

      if (!answer) return;
      faqQuestions.forEach((otherQuestion) => {
        if (otherQuestion !== question) {
          const otherAnswerId = otherQuestion.getAttribute("aria-controls");
          const otherAnswer = document.getElementById(otherAnswerId);

          if (otherAnswer) {
            otherQuestion.setAttribute("aria-expanded", "false");
            otherAnswer.classList.remove("show");
            otherAnswer.setAttribute("hidden", "");
          }
        }
      });
      if (isExpanded) {
        question.setAttribute("aria-expanded", "false");
        answer.classList.remove("show");
        answer.setAttribute("hidden", "");
      } else {
        question.setAttribute("aria-expanded", "true");
        answer.classList.add("show");
        answer.removeAttribute("hidden");

        setTimeout(() => {
          question.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
          });
        }, 100);
      }
    });

    question.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        question.click();
      }
    });
  });

  const whatsappCta = document.querySelector(".faq-cta .cta-whatsapp");
  if (whatsappCta) {
    whatsappCta.addEventListener("click", (e) => {
      console.log("FAQ WhatsApp CTA clicked");
    });
  }
});
