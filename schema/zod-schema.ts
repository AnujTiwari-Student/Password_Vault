import * as z from "zod";

const ERR_PASSWORD_REQ = "Password doesn't meet requirements";
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{6,}$/;
const COMMON_PASSWORDS_SET = new Set([
  'password', '123456', '123456789', 'qwerty', 'abc123', 'football', '12345678',
  '111111', '1234567', 'sunshine', 'iloveyou',
]);

const PasswordField = z.string()
  .min(8, { message: ERR_PASSWORD_REQ })
  .regex(PASSWORD_REGEX, { message: ERR_PASSWORD_REQ })
  .refine(val => !COMMON_PASSWORDS_SET.has(val.toLowerCase()), {
    message: "Password is too common or insecure",
  });

export const LoginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: PasswordField,
  callbackUrl: z.string().optional(),
  csrfToken: z.string().optional(),
}).strict();

export const RegisterSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: PasswordField,
  confirmPassword: z.string(),
}).strict().refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
});

export const AccountTypeValidationSchema = z.object({
    orgName: z
        .string()
        .min(1, { message: "Organization name is required" })
        .min(3, { message: "Organization name must be at least 3 characters" })
        .max(50, { message: "Organization name must be less than 50 characters" })
        .regex(
            /^[a-zA-Z0-9\s\-_&.]+$/,
            { message: "Organization name can only contain letters, numbers, spaces, and -_&." }
        )
        .transform((val) => val.trim()) 
        .refine(
            (val) => val.length > 0,
            { message: "Organization name cannot be only whitespace" }
        )
        .refine(
            (val) => !val.match(/\s{2,}/),
            { message: "Organization name cannot contain multiple consecutive spaces" }
        ),
    accountType: z.enum(["org", "personal"]),
});

export type AccountTypeValidationType = z.infer<typeof AccountTypeValidationSchema>;

export const CompleteOrgCreationSchema = z.object({
    orgName: AccountTypeValidationSchema.shape.orgName,
    masterKeyHash: z.string().min(1, "Master key hash is required"),
    encryptedMasterKey: z.string().min(1, "Encrypted master key is required"),
    userId: z.string().uuid("Invalid user ID format"),
});

export type CompleteOrgCreationType = z.infer<typeof CompleteOrgCreationSchema>;

export const VaultCreationSchema = z.object({
    name: z.string().min(1, "Vault name is required"),
    type: z.enum(["personal", "org"]),
    orgId: z.string().optional(),
    ovkId: z.string().optional(), 
});

export type VaultCreationType = z.infer<typeof VaultCreationSchema>;

// Define ItemType enum locally
export const ITEM_TYPES = ["login", "note", "totp"] as const;
export type ItemTypeEnum = typeof ITEM_TYPES[number];

export const ItemCreationSchema = z.object({
    mnemonic: z.string().min(1, "Mnemonic is required"),
    item_name: z.string().min(1, "Item name is required"),
    item_url: z.string().optional(),
    username_ct: z.string().optional(),
    password_ct: z.string().optional(),
    totp_seed_ct: z.string().optional(),
    vaultId: z.string(),
    item_key_wrapped: z.string().optional(),
    type: z.array(z.enum(ITEM_TYPES)).min(1, "At least one item type is required"), // Fixed line
    tags: z.array(z.string()).optional(),
    notes_ct: z.string().optional(),
    created_by: z.string()
}).refine((data) => {
    if (data.type.includes('login') && !data.username_ct && !data.password_ct) {
        return false;
    }
    if (data.type.includes('note') && !data.notes_ct) {
        return false;
    }
    if (data.type.includes('totp') && !data.totp_seed_ct) {
        return false;
    }
    return true;
}, {
    message: "Please fill required fields for selected item types"
});

export type ItemCreationType = z.infer<typeof ItemCreationSchema>;

export const CreateTeamSchema = z.object({
  name: z.string().min(1, "Team name is required").max(50, "Team name must be less than 50 characters"),
  description: z.string().max(200, "Description must be less than 200 characters").optional()
});

export const AddMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin", "owner", "viewer"])
});

export const CreateOrgSchema = z.object({
  name: z.string().min(2, {
    message: "Organization name must be at least 2 characters"
  }).max(50, {
    message: "Organization name must be less than 50 characters"
  }),
  description: z.string().optional(),
});

export type CreateOrgSchemaType = z.infer<typeof CreateOrgSchema>;
