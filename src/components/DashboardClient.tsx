"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BellRing } from 'lucide-react';

export default function DashboardClient() {

  return (
    <Alert>
      <BellRing />
      <AlertTitle>Work in progress</AlertTitle>
      <AlertDescription>
        YieldFlow is actively being built. Some features may change as I refine the
        experience — your data and feedback help shape what comes next. Values are
        estimates and may differ from bank-posted figures since institutions can use
        different interest conventions (for example, day-count basis like /365).
      </AlertDescription>
    </Alert>
  );

}
