export const censorPhoneNumber = (phoneNumber: string) => {
    phoneNumber = phoneNumber.toString();

    if (phoneNumber.length !== 12) {
        return "Nomor ponsel tidak valid";
    }

    const prefix = phoneNumber.substring(0, 3);
    const suffix = phoneNumber.substring(9);

    const censoredPhoneNumber = `${prefix}*******${suffix}`;

    return censoredPhoneNumber;
};
