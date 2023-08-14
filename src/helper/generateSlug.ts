const generateSlug = (title: string, lastSlug?: string) => {
    return title
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "")
        .replace(/\-\-+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const generateSlugFromLastSlug = (lastSlug: string) => {
    const match = lastSlug.match(/(\d+)/);
    if (match) {
        const currentNumber = parseInt(match[0]);
        return lastSlug.replace(match[0], (currentNumber + 1).toString());
    }

    return lastSlug + "-1";
};

export default generateSlug;
