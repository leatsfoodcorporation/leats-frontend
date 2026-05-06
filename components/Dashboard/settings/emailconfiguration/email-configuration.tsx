"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axiosInstance from "@/lib/axios";

interface EmailSettings {
  id?: string;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword?: string; // Optional for updates
  fromEmail: string;
  fromName: string;
  encryption: "none" | "tls" | "ssl";
}

interface TestEmailData {
  to: string;
  subject: string;
  message: string;
}

export const EmailConfiguration = () => {
  const [settings, setSettings] = useState<EmailSettings>({
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    fromEmail: "",
    fromName: "",
    encryption: "tls",
  });

  const [testEmail, setTestEmail] = useState<TestEmailData>({
    to: "",
    subject: "Test Email",
    message: "This is a test email from your application.",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);

  // Load existing configuration on component mount
  useEffect(() => {
    loadEmailConfiguration();
  }, []);

  const loadEmailConfiguration = async () => {
    try {
      const response = await axiosInstance.get(
        "/api/email/dashboard/settings/email-configuration"
      );
      if (response.data.success) {
        const config = response.data.data;
        setSettings({
          id: config.id,
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUsername: config.smtpUsername,
          smtpPassword: "",
          fromEmail: config.fromEmail,
          fromName: config.fromName,
          encryption: config.encryption,
        });
      }
    } catch {
      // Silently handle - no existing configuration is normal
    }
  };

  const handleInputChange = (field: keyof EmailSettings, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestEmailChange = (field: keyof TestEmailData, value: string) => {
    setTestEmail((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // Prepare data - exclude empty password if updating existing config
      const dataToSend = { ...settings };
      if (settings.id && !settings.smtpPassword) {
        delete dataToSend.smtpPassword;
      }

      const endpoint = settings.id
        ? `/api/email/dashboard/settings/email-configuration/${settings.id}`
        : "/api/email/dashboard/settings/email-configuration";

      const method = settings.id ? "put" : "post";

      const response = await axiosInstance[method](endpoint, dataToSend);

      if (response.data.success) {
        toast.success("Email configuration saved successfully!");
        setSettings((prev) => ({ ...prev, id: response.data.data.id }));
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to save email configuration";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail.to || !testEmail.subject || !testEmail.message) {
      toast.error("Please fill in all test email fields");
      return;
    }

    setIsTestLoading(true);

    try {
      const response = await axiosInstance.post(
        "/api/email/dashboard/settings/email-configuration/test",
        testEmail
      );

      if (response.data.success) {
        toast.success("Test email sent successfully!");
      }
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to send test email";
      toast.error(errorMessage);
    } finally {
      setIsTestLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Email Configuration</h2>
        <p className="text-muted-foreground mb-6">
          Configure SMTP settings for sending emails from your application.
        </p>
      </div>

      {/* SMTP Configuration */}
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">SMTP Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Host */}
          <div>
            <Label htmlFor="smtpHost">SMTP Host *</Label>
            <input
              id="smtpHost"
              type="text"
              value={settings.smtpHost}
              onChange={(e) => handleInputChange("smtpHost", e.target.value)}
              placeholder="smtp.gmail.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* SMTP Port */}
          <div>
            <Label htmlFor="smtpPort">SMTP Port *</Label>
            <input
              id="smtpPort"
              type="text"
              value={settings.smtpPort}
              onChange={(e) => handleInputChange("smtpPort", e.target.value)}
              placeholder="587"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* SMTP Username */}
          <div>
            <Label htmlFor="smtpUsername">SMTP Username *</Label>
            <input
              id="smtpUsername"
              type="text"
              value={settings.smtpUsername}
              onChange={(e) =>
                handleInputChange("smtpUsername", e.target.value)
              }
              placeholder="your-email@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* SMTP Password */}
          <div>
            <Label htmlFor="smtpPassword">SMTP Password *</Label>
            <input
              id="smtpPassword"
              type="password"
              value={settings.smtpPassword}
              onChange={(e) =>
                handleInputChange("smtpPassword", e.target.value)
              }
              placeholder="••••••••"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* From Email */}
          <div>
            <Label htmlFor="fromEmail">From Email *</Label>
            <input
              id="fromEmail"
              type="email"
              value={settings.fromEmail}
              onChange={(e) => handleInputChange("fromEmail", e.target.value)}
              placeholder="noreply@yourcompany.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* From Name */}
          <div>
            <Label htmlFor="fromName">From Name</Label>
            <input
              id="fromName"
              type="text"
              value={settings.fromName}
              onChange={(e) => handleInputChange("fromName", e.target.value)}
              placeholder="Your Company Name"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Encryption */}
          <div className="md:col-span-2">
            <Label htmlFor="encryption">Encryption</Label>
            <select
              id="encryption"
              value={settings.encryption}
              onChange={(e) => handleInputChange("encryption", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="none">None</option>
              <option value="tls">TLS</option>
              <option value="ssl">SSL</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 mt-6 pt-6 border-t">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </div>

      {/* Test Email Section */}
      <div className="rounded-lg border p-6">
        <h3 className="text-lg font-medium mb-4">Test Email</h3>
        <div className="space-y-4">
          {/* Sender Email */}
          <div>
            <Label htmlFor="testTo">Sender Email *</Label>
            <input
              id="testTo"
              type="email"
              value={testEmail.to}
              onChange={(e) => handleTestEmailChange("to", e.target.value)}
              placeholder="recipient@example.com"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="testSubject">Subject *</Label>
            <input
              id="testSubject"
              type="text"
              value={testEmail.subject}
              onChange={(e) => handleTestEmailChange("subject", e.target.value)}
              placeholder="Test Email Subject"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* Message Field */}
          <div>
            <Label htmlFor="testMessage">Message *</Label>
            <textarea
              id="testMessage"
              value={testEmail.message}
              onChange={(e) => handleTestEmailChange("message", e.target.value)}
              placeholder="Enter your test message here..."
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            />
          </div>

          {/* Test Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleTestEmail}
              disabled={isTestLoading || !settings.id}
              variant="outline"
            >
              {isTestLoading ? "Sending..." : "Send Test Email"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
