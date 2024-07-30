type SelectedFields<T, K extends keyof T> = {
    [P in K]: T[P];
};

type FieldSelector<T> = keyof T | [keyof T, string];

export const selectFields = <T>(items: T[], fields: FieldSelector<T>[]): Partial<Record<string, any>>[] =>
    items.map((item) =>
        fields.reduce((acc, field) => {
            if (Array.isArray(field)) {
                const [originalField, alias] = field;
                acc[alias] = item[originalField];
            } else {
                //@ts-ignore
                acc[field] = item[field];
            }
            return acc;
        }, {} as Partial<Record<string, any>>),
    );
