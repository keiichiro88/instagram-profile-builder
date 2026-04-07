"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Lightbulb } from "lucide-react";

interface ExamplePopoverProps {
  exampleText: string;
}

export function ExamplePopover({ exampleText }: ExamplePopoverProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 text-primary">
            <Lightbulb className="size-4" data-icon="inline-start" />
            はやぴんの場合
          </Button>
        }
      />
      <SheetContent side="bottom" className="rounded-t-2xl pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <SheetHeader>
          <SheetTitle>はやぴんの回答例</SheetTitle>
          <SheetDescription>
            参考にしてみてね！自分の言葉で書くのが一番大切だよ
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <div className="rounded-xl bg-primary/5 p-4">
            <p className="whitespace-pre-wrap text-sm leading-[1.75] tracking-[0.04em] text-foreground">
              {exampleText}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
