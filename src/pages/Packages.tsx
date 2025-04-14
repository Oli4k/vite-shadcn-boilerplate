import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Package as PackageIcon } from "lucide-react";

const packages = [
  {
    id: 1,
    name: "Premium Membership",
    type: "Membership",
    price: "$99/month",
    duration: "Monthly",
    features: ["Unlimited court access", "Priority booking", "Free equipment rental"],
  },
  {
    id: 2,
    name: "Standard Membership",
    type: "Membership",
    price: "$69/month",
    duration: "Monthly",
    features: ["10 court hours/month", "Standard booking", "Discounted equipment rental"],
  },
  {
    id: 3,
    name: "Court Booking Package",
    type: "Booking",
    price: "$200",
    duration: "10 hours",
    features: ["10 hours of court time", "Valid for 3 months", "Transferable"],
  },
];

export function Packages() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Packages</h2>
          <p className="text-muted-foreground">
            Manage membership and booking packages
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Features</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="font-medium">{pkg.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{pkg.type}</Badge>
                </TableCell>
                <TableCell>{pkg.price}</TableCell>
                <TableCell>{pkg.duration}</TableCell>
                <TableCell>
                  <ul className="list-disc list-inside">
                    {pkg.features.map((feature, index) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 