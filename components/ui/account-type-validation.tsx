"use client"

import { AccountTypeValidationSchema, AccountTypeValidationType } from "@/schema/zod-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./form";
import { Input } from "./input";
import React from "react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./select";

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
                <form className='space-y-4'>
                    <div className='space-y-4'>
                        <FormField
                            control={form.control}
                            name="accountType"
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormLabel className="text-white">Account Type</FormLabel>
                                        <FormControl>
                                            <SelectTrigger className="bg-gray-800 border-gray-700 text-white w-full focus:border-blue-500">
                                                <SelectValue placeholder="Select an account type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="bg-gray-800 border-gray-700">
                                            <SelectGroup>
                                                <SelectItem value="org" className="text-white hover:bg-gray-700">Organization</SelectItem>
                                                <SelectItem value="personal" className="text-white hover:bg-gray-700">Personal</SelectItem>
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
                                    <FormItem>
                                        <FormLabel className="text-white">Organization Name</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                placeholder="Your organization name"
                                                className="w-full px-4 h-10 bg-gray-800 border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 placeholder-gray-500"
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