/* Interacciones, cartas, almacenamiento local y configuración editable. */
// CONFIGURACIÓN: este webhook recibe las cartas del compositor rápido.
const letterWebhookUrl = "https://discordapp.com/api/webhooks/1553535796622135447/sbQEN1iSgbOtXYrDEPA6iAbXKw0Xq2uYgP_UhWQX4fd5SNlxwIGv7NBHRayc9-4TE0Bl";
// CONFIGURACIÓN: webhook que recibe la respuesta Sí/No de la propuesta original.
const responseWebhookUrl = "https://discordapp.com/api/webhooks/1553516456996507681/85zh0weBgdar4t5_BZzlX8ye8jadiRZBNVLBT_VyhbYVQ1LeL8NQr98oaVcAvPs8v9_F";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let openingTimer;
  // INTERRUPTOR: cambia a true para desbloquear la segunda carta; false la mantiene cerrada.
    const segundaCartaDesbloqueada = false;
  // CONTENIDO EDITABLE: cambia title, message y signature. Mientras esté bloqueada,
  // la tarjeta solo muestra el texto de reserva. En una web estática, el código cliente
  // puede inspeccionarse; no guardes aquí información que deba ser confidencial.
    const segundaCarta = {
      id: "segunda-carta",
      title: "Un secreto para ti",
      description: "Hay algo especial guardado en este sobre.",
      category: "Un secreto sellado",
      message: `ESCRIBE AQUÍ EL TEXTO DE TU SEGUNDA CARTA.\n\nPuedes cambiar este texto directamente en el código.`,
      signature: "[Tu nombre]",
      isSecret: true
    };
    const proposalCard = {
      id: "proposal",
      title: "¿Quieres ser mi novia de adeberitas?",
      description: "Una pregunta importante, guardada en su propio sobre.",
      category: "La primera carta",
      isProposal: true
    };

    const overlays = [...document.querySelectorAll(".overlay")];

    // Genera una tarjeta. La carta secreta usa textos neutros hasta que se desbloquee.
    function makeCard(letter) {
      const article = document.createElement("article");
      const isLocked = letter.isSecret && !segundaCartaDesbloqueada;
      article.className = `letter-card${letter.isSecret ? " letter-card--secret" : ""}${isLocked ? " is-locked" : ""}`;

      const openButton = document.createElement("button");
      openButton.className = "letter-open";
      openButton.type = "button";
      openButton.dataset.openLetter = letter.id;
      openButton.disabled = isLocked;

      const thumbnail = document.createElement("span");
      thumbnail.className = "envelope-thumb";
      const image = document.createElement("img");
      image.src = "img/cerrada.png";
      image.alt = "Sobre cerrado";
      thumbnail.append(image);
      if (isLocked) {
        const lockBadge = document.createElement("span");
        lockBadge.className = "lock-badge";
        lockBadge.textContent = "🔒";
        lockBadge.setAttribute("aria-label", "Carta bloqueada");
        thumbnail.append(lockBadge);
      }

      const copy = document.createElement("span");
      copy.className = "card-copy";
      const category = document.createElement("span");
      category.className = "card-category";
      category.textContent = isLocked ? "Carta bloqueada" : letter.category || "Una carta para ti";
      const title = document.createElement("span");
      title.className = "card-title";
      title.textContent = isLocked ? "Es un secreto en construcción" : letter.title;
      const description = document.createElement("span");
      description.className = "card-description";
      description.textContent = isLocked ? "Es un secreto en construcción" : letter.description || "Unas palabras guardadas con cariño.";
      copy.append(category, title, description);
      openButton.append(thumbnail, copy);
      article.append(openButton);

      const footer = document.createElement("div");
      footer.className = "card-footer";
      const hint = document.createElement("span");
      hint.className = "card-hint";
      hint.textContent = isLocked ? "🔒 Es un secreto en construcción" : "Abrir carta →";
      footer.append(hint);

      if (!letter.isProposal && !letter.isSecret) {
        const removeButton = document.createElement("button");
        removeButton.className = "delete-letter";
        removeButton.type = "button";
        removeButton.dataset.deleteLetter = letter.id;
        removeButton.title = "Eliminar carta";
        removeButton.setAttribute("aria-label", `Eliminar ${letter.title}`);
        removeButton.textContent = "×";
        footer.append(removeButton);
      }

      article.append(footer);
      return article;
    }

    // Mantiene Inicio y Mis cartas sincronizados con la colección actual.
    function renderCards() {
      const allLetters = [proposalCard, segundaCarta];
      for (const gridId of ["home-cards", "collection-cards"]) {
        const grid = document.getElementById(gridId);
        grid.replaceChildren();
        const visibleLetters = gridId === "home-cards" ? allLetters.slice(0, 3) : allLetters;

        if (visibleLetters.length === 0) {
          const empty = document.createElement("div");
          empty.className = "empty-state";
          empty.innerHTML = "<strong>Aún no hay cartas</strong>Tu primera carta puede empezar aquí.";
          grid.append(empty);
          continue;
        }

        visibleLetters.forEach((letter) => grid.append(makeCard(letter)));
      }
    }

    function showOverlay(overlay) {
      overlay.hidden = false;
      const firstButton = overlay.querySelector("button");
      if (firstButton) firstButton.focus();
    }

    function abrirCartaConAnimacion(overlay) {
      const scene = document.getElementById("envelope-scene");
      window.clearTimeout(openingTimer);
      scene.hidden = false;
      openingTimer = window.setTimeout(() => {
        scene.hidden = true;
        showOverlay(overlay);
        openingTimer = undefined;
      }, reducedMotion ? 0 : 960);
    }

    function showView(viewName) {
      document.getElementById("home-view").hidden = viewName !== "home";
      document.getElementById("collection-view").hidden = viewName !== "collection";
      document.querySelectorAll("[data-view-target]").forEach((tab) => {
        if (tab.dataset.viewTarget === viewName) tab.setAttribute("aria-current", "page");
        else tab.removeAttribute("aria-current");
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Envía a Discord la respuesta a la propuesta inicial.
    async function notificarDiscord(opcion) {
      try {
        const respuesta = await fetch(responseWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: `Nueva respuesta a la propuesta: **${opcion}**` })
        });
        if (!respuesta.ok) console.error("Discord no aceptó la notificación.");
      } catch (error) {
        console.error("No se pudo enviar la notificación a Discord.", error);
      }
    }

    function responder(opcion) {
      void notificarDiscord(opcion);
      document.getElementById("proposal-overlay").hidden = true;
      showOverlay(document.getElementById(opcion === "Sí" ? "yes-overlay" : "no-overlay"));
    }

    renderCards();

    document.querySelector(".brand").addEventListener("click", (event) => {
      event.preventDefault();
      showView("home");
    });

    document.querySelectorAll("[data-view-target]").forEach((tab) => {
      tab.addEventListener("click", () => showView(tab.dataset.viewTarget));
    });
    document.querySelector("[data-go-collection]").addEventListener("click", () => showView("collection"));

    // Delegación de eventos para abrir cartas y eliminar las cartas personales.
    document.querySelectorAll(".card-grid").forEach((grid) => {
      grid.addEventListener("click", (event) => {
        const openButton = event.target.closest("[data-open-letter]");
        if (openButton) {
          const letter = [proposalCard, segundaCarta].find((item) => item.id === openButton.dataset.openLetter);
          if (!letter) return;
          if (letter.isProposal) {
            abrirCartaConAnimacion(document.getElementById("proposal-overlay"));
          } else if (letter.isSecret) {
            document.getElementById("secret-letter-title").textContent = letter.title;
            document.getElementById("secret-letter-copy").textContent = letter.message;
            document.getElementById("secret-letter-signature").textContent = letter.signature || "[Tu nombre]";
            abrirCartaConAnimacion(document.getElementById("secret-letter-overlay"));
          }
          return;
        }
      });
    });

    document.querySelectorAll("[data-new-letter]").forEach((button) => {
      button.addEventListener("click", () => {
        const form = document.getElementById("letter-form");
        form.reset();
        document.getElementById("form-error").hidden = true;
        document.getElementById("message-count").textContent = "0 / 1600";
        showOverlay(document.getElementById("new-letter-overlay"));
        form.elements.title.focus();
      });
    });

    // Envía una nota privada a Discord; nunca la agrega a las tarjetas de la web.
    document.getElementById("letter-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const values = new FormData(form);
      const title = values.get("title").trim();
      const message = values.get("message").trim();
      const signature = values.get("signature").trim();
      const status = document.getElementById("form-error");
      const submitButton = document.getElementById("send-letter-button");
      const content = [`💌 NUEVA CARTA`, `**Asunto:** ${title}`, "", message, signature ? `\n— ${signature}` : ""].join("\n");

      submitButton.disabled = true;
      submitButton.textContent = "Enviando...";
      status.hidden = true;

      fetch(letterWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, allowed_mentions: { parse: [] } })
      }).then((response) => {
        if (!response.ok) throw new Error(`Discord respondió con estado ${response.status}.`);
        status.dataset.state = "success";
        status.textContent = "Carta enviada. Ya llegó a Discord.";
        status.hidden = false;
        form.reset();
        document.getElementById("message-count").textContent = "0 / 1600";
      }).catch((error) => {
        console.error("No se pudo enviar la carta a Discord.", error);
        status.dataset.state = "error";
        status.textContent = "No se pudo confirmar el envío. Revisa tu conexión e inténtalo de nuevo.";
        status.hidden = false;
      }).finally(() => {
        submitButton.disabled = false;
        submitButton.innerHTML = '<span aria-hidden="true">➤</span> Enviar carta';
      });
    });

    document.querySelector('[name="message"]').addEventListener("input", (event) => {
      document.getElementById("message-count").textContent = `${event.currentTarget.value.length} / 1600`;
    });

    document.getElementById("yes-button").addEventListener("click", () => responder("Sí"));
    document.getElementById("no-button").addEventListener("click", () => responder("No"));

    document.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => {
        button.closest(".overlay").hidden = true;
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        window.clearTimeout(openingTimer);
        overlays.forEach((overlay) => { overlay.hidden = true; });
        document.getElementById("envelope-scene").hidden = true;
      }
    });

