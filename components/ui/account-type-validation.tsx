"use client"

import React from "react";
import { AccountTypeValidationSchema, AccountTypeValidationType } from "@/schema/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Building2, User } from "lucide-react";

interface AccountSetupFormProps {
    setOrgName: (name: string) => void;
    setAccountType: (type: "org" | "personal") => void;
}

function AccountTypeValidation({ setOrgName, setAccountType }: AccountSetupFormProps) {

    const form = useForm<AccountTypeValidationType>({
        resolver: zodResolver(AccountTypeValidationSchema),
        defaultValues: {
            orgName: "",
            accountType: "org"
        },
        mode: "onChange"
    })

    const accountTypeValue = form.watch("accountType");
    const orgNameValue = form.watch("orgName");

    React.useEffect(() => {
        setAccountType(accountTypeValue);
    }, [accountTypeValue, setAccountType]);

    React.useEffect(() => {
        if (accountTypeValue === "org" && orgNameValue) {
            setOrgName(orgNameValue);
        } else {
            setOrgName("");
        }
    }, [orgNameValue, accountTypeValue, setOrgName]);

    return (
        <div className='w-full'>
            <Form {...form}>
                <form className='space-y-5'>
                    <div className='space-y-5'>
                        <FormField
                            control={form.control}
                            name="accountType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">Account Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="bg-white border-gray-200 text-gray-900 h-11 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm">
                                                <SelectValue placeholder="Select an account type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-white border-gray-200 text-gray-900 shadow-xl rounded-xl">
                                            <SelectGroup>
                                                <SelectItem value="org" className="cursor-pointer py-3 focus:bg-gray-50">
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="w-4 h-4 text-blue-600" />
                                                        <span>Organization (Admin Use)</span>
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="personal" className="cursor-pointer py-3 focus:bg-gray-50">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4 text-gray-500" />
                                                        <span>Personal Account</span>
                                                    </div>
                                                </SelectItem>
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {accountTypeValue === "org" && (
                            <FormField
                                control={form.control}
                                name="orgName"
                                render={({ field }) => (
                                    <FormItem className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <FormLabel className="text-gray-700 font-medium">Organization Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="e.g. Acme Corp"
                                                className="w-full px-4 h-11 bg-white border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </form>
            </Form>
        </div>
    )
}

export default AccountTypeValidation