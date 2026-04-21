import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VendorsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-zinc-600">Vendor management module will be implemented after Inventory and Sales.</p>
      </CardContent>
    </Card>
  );
}
