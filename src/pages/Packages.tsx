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
import { Plus } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { usePageHeader } from '@/contexts/page-header-context'
import { useEffect } from 'react'

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
  const { setActions } = usePageHeader()

  useEffect(() => {
    setActions(
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add Package
        </Button>
    )

    return () => setActions(null)
  }, [setActions])

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Packages</CardTitle>
          <CardDescription className="text-xs">List of all membership and booking packages</CardDescription>
        </CardHeader>
        <CardContent>
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
                        <li key={index} className="text-xs text-muted-foreground">
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
        </CardContent>
      </Card>
    </div>
  );
} 