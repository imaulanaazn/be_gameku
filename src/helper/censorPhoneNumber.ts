export const censorPhoneNumber = (phoneNumber: string) => {
    phoneNumber = phoneNumber.toString();
    const prefix = phoneNumber.substring(0, 3);
    const suffix = phoneNumber.substring(9);

    const censoredPhoneNumber = `${prefix}*******${suffix}`;

    return censoredPhoneNumber;
};
