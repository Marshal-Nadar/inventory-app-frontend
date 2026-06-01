export const triggerPrint = () => {
  const originalTitle = document.title;
  document.title = " "; // blank title → blank browser header
  setTimeout(() => {
    window.print();
    document.title = originalTitle; // restore after print
  }, 50);
};
