const statusElement = document.getElementById("status");
fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
  .then((response) => response.ok ? response.json() : null)
  .then((user) => {
    statusElement.textContent = user
      ? `Sessão de ${user.displayName || user.email || "usuário"} (${user.provider}).`
      : "Nenhuma sessão neste navegador.";
    document.getElementById("login-actions").hidden = Boolean(user);
    document.getElementById("logout-form").hidden = !user;
  })
  .catch(() => { statusElement.textContent = "Não foi possível consultar a sessão."; });
