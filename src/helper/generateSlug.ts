const generateSlug = (title: string) => {
    return title
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .trim();
};
export default generateSlug;
