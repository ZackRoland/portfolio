document.addEventListener("DOMContentLoaded", () => {
    if (!document.startViewTransition) return;
  
    document.addEventListener("click", (event) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey ||
          event.shiftKey || event.altKey) {
        return;
      }
  
      const link = event.target.closest("a");
      if (!link) return;
  
      if (link.target && link.target !== "_self") return;
  
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
  
      if (url.pathname === window.location.pathname && url.hash !== "") return;
  
      event.preventDefault(); 
  
      document.startViewTransition(() => {
        window.location.href = url.href;
      });
    });
  });
  