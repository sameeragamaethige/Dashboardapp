"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, AlertCircle } from "lucide-react"
import { LocalStorageService } from "@/lib/database-service"


import PackagesManager from "./PackagesManager"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"



// --- Multi-bank details management ---
const bankFormSchema = z.object({
  bankName: z.string().min(2, { message: "Bank name must be at least 2 characters." }),
  accountName: z.string().min(2, { message: "Account name must be at least 2 characters." }),
  accountNumber: z.string().min(5, { message: "Account number must be at least 5 characters." }),
  branchName: z.string().min(2, { message: "Branch name must be at least 2 characters." }),
  swiftCode: z.string().optional(),
  additionalInstructions: z.string().optional(),
});

type BankDetail = z.infer<typeof bankFormSchema> & { id: string };

type BankDetailsSettingsProps = {
  initialData?: BankDetail[];
  onSave?: (data: BankDetail[]) => Promise<any>;
};

export default function BankDetailsSettings({ initialData, onSave }: BankDetailsSettingsProps) {
  const [bankDetails, setBankDetails] = useState<BankDetail[]>(initialData || []);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const form = useForm<z.infer<typeof bankFormSchema>>({
    resolver: zodResolver(bankFormSchema) as any,
    defaultValues: {
      bankName: "",
      accountName: "",
      accountNumber: "",
      branchName: "",
      swiftCode: "",
      additionalInstructions: "",
    },
    mode: "onChange"
  });

  useEffect(() => {
    const loadBankDetails = async () => {
      // If initialData is provided, use it
      if (initialData && initialData.length > 0) {
        console.log('Using initial data:', initialData);
        setBankDetails(initialData);
        return;
      }

      try {
        console.log('Loading bank details...');
        const dbBankDetails = await LocalStorageService.getBankDetails();
        console.log('Received bank details:', dbBankDetails);

        if (dbBankDetails && Array.isArray(dbBankDetails)) {
          // The data should already be in the correct format from LocalStorageService
          setBankDetails(dbBankDetails);
        } else {
          console.warn('No bank details found or invalid format:', dbBankDetails);
          setBankDetails([]);
        }
      } catch (error) {
        console.error('Error loading bank details:', error);
        setBankDetails([]);
      }
    };

    loadBankDetails();
  }, [initialData]);

  const saveBankDetails = async (banks: BankDetail[] | undefined | null) => {
    const safeBanks = Array.isArray(banks) ? banks : [];
    console.log('Saving bank details:', safeBanks);
    setBankDetails(safeBanks);

    try {
      // If onSave prop is provided, call it
      if (onSave) {
        await onSave(safeBanks);
      } else {
        await LocalStorageService.saveBankDetails(safeBanks);
      }
      console.log('Bank details saved successfully');
    } catch (error) {
      console.error('Error saving bank details:', error);
    }
  };

  const handleAddBank = () => {
    setEditingId(null);
    setShowForm(true);
    form.reset({
      bankName: "",
      accountName: "",
      accountNumber: "",
      branchName: "",
      swiftCode: "",
      additionalInstructions: "",
    });
  };

  const handleEditBank = (bank: BankDetail) => {
    setEditingId(bank.id);
    setShowForm(true);
    form.reset(bank);
  };

  const handleDeleteBank = async (id: string) => {
    const updated = bankDetails.filter(b => b.id !== id);
    await saveBankDetails(updated);
  };

  const onSubmit = async (values: z.infer<typeof bankFormSchema>) => {
    let updated: BankDetail[];
    if (editingId) {
      updated = bankDetails.map(b => b.id === editingId ? { ...values, id: editingId } : b);
    } else {
      updated = [...bankDetails, { ...values, id: Math.random().toString(36).slice(2) }];
    }
    await saveBankDetails(updated);
    setShowForm(false);
    setEditingId(null);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>Manage your payment plans and bank details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full">
            <Tabs defaultValue="fees" className="w-full">
              <TabsList className="mb-4 flex border border-gray-200 rounded-lg overflow-hidden w-fit bg-white">
                <TabsTrigger value="fees" className="px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r border-gray-200 first:rounded-l-lg last:rounded-r-lg data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-black">Fees & Packages</TabsTrigger>
                <TabsTrigger value="bank" className="px-6 py-2 text-sm font-medium transition-colors duration-150 focus:outline-none border-r-0 border-gray-200 first:rounded-l-lg last:rounded-r-lg data-[state=active]:bg-gray-100 data-[state=active]:text-black data-[state=inactive]:bg-white data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-black">Bank Details</TabsTrigger>
              </TabsList>
              <TabsContent value="fees">
                <PackagesManager />
              </TabsContent>
              <TabsContent value="bank">
                {saveSuccess && (
                  <Alert className="mb-6 bg-green-50 border-green-200">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle className="text-green-700">Success</AlertTitle>
                    <AlertDescription className="text-green-700">Bank details have been saved successfully.</AlertDescription>
                  </Alert>
                )}
                {/* List all saved bank details as cards */}
                {bankDetails.length > 0 && (
                  <div className="space-y-4">
                    {bankDetails.map(bank => (
                      <Card key={bank.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between border border-blue-200">
                        <div>
                          <div className="font-semibold text-lg">{bank.bankName}</div>
                          <div className="text-sm text-muted-foreground">Branch: {bank.branchName}</div>
                          <div className="text-sm">Account Name: {bank.accountName}</div>
                          <div className="text-sm">Account Number: {bank.accountNumber}</div>
                          {bank.swiftCode && <div className="text-sm">SWIFT: {bank.swiftCode}</div>}
                          {bank.additionalInstructions && <div className="text-xs text-muted-foreground mt-1">{bank.additionalInstructions}</div>}
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <Button size="sm" variant="outline" onClick={() => handleEditBank(bank)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDeleteBank(bank.id)}>Delete</Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
                {/* Add new bank button */}
                <Button type="button" onClick={handleAddBank} className="mt-4">Add New Bank</Button>
                {/* Bank details form */}
                {showForm && (
                  <Form {...form}>
                    <div className="space-y-6 mt-6 border-t pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter bank name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="branchName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Branch Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter branch name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="accountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter account holder name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter account number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="swiftCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>SWIFT Code (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter SWIFT code" {...field} />
                              </FormControl>
                              <FormDescription>For international transfers</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="additionalInstructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Additional Instructions (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter any additional payment instructions"
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button type="button" onClick={form.handleSubmit(onSubmit)}>
                          {editingId ? "Update Bank" : "Save Bank"}
                        </Button>
                        <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
                      </div>
                    </div>
                  </Form>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
