export const triggerPrint = () => {
  const originalTitle = document.title;
  document.title = " "; // blank title → blank browser header
  setTimeout(() => {
    window.print();
    document.title = originalTitle; // restore after print
  }, 50);
};

export const triggerReceiptPrint = () => {
  const originalTitle = document.title;
  document.title = " ";
  document.body.classList.add("printing-receipt");

  setTimeout(() => {
    window.print();
    document.title = originalTitle;
    document.body.classList.remove("printing-receipt");
  }, 50);
};
