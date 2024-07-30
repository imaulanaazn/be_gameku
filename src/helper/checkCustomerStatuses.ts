import { CustomerEntity } from "@entity/customer.entity";
import { CustomerStatuses } from "@enum/index";
import dayjs from "dayjs";

export const getCustomerStatuses = (customer: CustomerEntity) => {
    const statuses = {
        valid: true,
        message: "",
    };

    switch (customer.status) {
        case CustomerStatuses.FREEZE:
            statuses.valid = false;
            const diff = dayjs(customer.lockUntil).diff(dayjs());
            if (customer.loginAttemps >= 3 && diff >= 0) {
                statuses.message = `Akun Anda terkunci sementara karena terlalu banyak percobaan login yang gagal. Coba lagi pada ${dayjs(
                    customer.lockUntil,
                ).format("DD MMMM YYYY HH:mm")}`;
            } else if (diff >= 0) {
                statuses.message = `Akun anda telah terkunci sementara. Silakan hubungi dukungan pelanggan untuk informasi lebih lanjut`;
            } else {
                statuses.valid = true;
            }
            break;
        case CustomerStatuses.SUSPENDED:
            statuses.valid = false;
            statuses.message = `Akun Anda telah ditangguhkan. Silakan hubungi dukungan pelanggan untuk informasi lebih lanjut`;
            break;

        default:
            statuses.message = "";
            statuses.valid = true;
            break;
    }

    return statuses;
};
