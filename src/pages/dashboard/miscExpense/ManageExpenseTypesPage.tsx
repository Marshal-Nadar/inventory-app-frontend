import { useEffect, useState, useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ArrowUpDown,
  Tags,
  X,
} from "lucide-react";
import {
  expenseTypeService,
  type ExpenseType,
  type ExpenseSubcategory,
} from "@/services/expenseTypeService";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { toast } from "sonner";

// ─── Flattened row for table ──────────────────────────────────────
interface TableRow {
  id: string; // unique key
  expense_type_id: number;
  expense_type_name: string;
  has_subcategory: boolean;
  subcategory_id: number | null;
  subcategory_name: string | null;
  is_type_row: boolean;
  type_subcategory_count: number;
  raw_type: ExpenseType;
  raw_sub: ExpenseSubcategory | null;
}

const columnHelper = createColumnHelper<TableRow>();

export const ManageExpenseTypesPage = () => {
  const [types, setTypes] = useState<ExpenseType[]>([]);
  const [expandedTypes, setExpandedTypes] = useState<
    Record<number, ExpenseSubcategory[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);

  // type form
  const [typeFormOpen, setTypeFormOpen] = useState(false);
  const [editingType, setEditingType] = useState<ExpenseType | null>(null);
  const [typeName, setTypeName] = useState("");
  const [hasSubcategory, setHasSubcategory] = useState(false);
  const [subcategoryInputs, setSubcategoryInputs] = useState<string[]>([""]);
  const [typeLoading, setTypeLoading] = useState(false);
  const [typeError, setTypeError] = useState("");

  // delete type
  const [deleteTypeOpen, setDeleteTypeOpen] = useState(false);
  const [deletingType, setDeletingType] = useState<ExpenseType | null>(null);
  const [deleteTypeLoading, setDeleteTypeLoading] = useState(false);
  const [deleteTypeError, setDeleteTypeError] = useState("");

  // subcategory form
  const [subFormOpen, setSubFormOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<ExpenseSubcategory | null>(null);
  const [subParentId, setSubParentId] = useState<number | null>(null);
  const [subName, setSubName] = useState("");
  const [subLoading, setSubLoading] = useState(false);
  const [subError, setSubError] = useState("");

  // delete sub
  const [deleteSubOpen, setDeleteSubOpen] = useState(false);
  const [deletingSub, setDeletingSub] = useState<ExpenseSubcategory | null>(
    null,
  );
  const [deleteSubLoading, setDeleteSubLoading] = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await expenseTypeService.getAll();
      setTypes(data);
      // fetch subcategories for all types that have them
      const subsMap: Record<number, ExpenseSubcategory[]> = {};
      await Promise.all(
        data
          .filter((t) => t.has_subcategory)
          .map(async (t) => {
            const detail = await expenseTypeService.getById(t.id);
            subsMap[t.id] = detail.subcategories || [];
          }),
      );
      setExpandedTypes(subsMap);
    } catch {
      toast.error("Failed to load expense types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // ─── Flatten data for table ───────────────────────────────────

  const flatRows = useMemo((): TableRow[] => {
    const rows: TableRow[] = [];
    for (const type of types) {
      const subs = (expandedTypes[type.id] || []).filter((s) => s.is_active);

      // type row
      rows.push({
        id: `type-${type.id}`,
        expense_type_id: type.id,
        expense_type_name: type.name,
        has_subcategory: type.has_subcategory,
        subcategory_id: null,
        subcategory_name: null,
        is_type_row: true,
        type_subcategory_count: subs.length,
        raw_type: type,
        raw_sub: null,
      });

      // subcategory rows
      for (const sub of subs) {
        rows.push({
          id: `sub-${sub.id}`,
          expense_type_id: type.id,
          expense_type_name: type.name,
          has_subcategory: type.has_subcategory,
          subcategory_id: sub.id,
          subcategory_name: sub.name,
          is_type_row: false,
          type_subcategory_count: subs.length,
          raw_type: type,
          raw_sub: sub,
        });
      }
    }
    return rows;
  }, [types, expandedTypes]);

  // ─── Search filter ────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!search.trim()) return flatRows;
    const q = search.toLowerCase();
    // keep type row if type name matches OR any of its sub rows match
    const matchingTypeIds = new Set<number>();
    flatRows.forEach((row) => {
      if (
        row.expense_type_name.toLowerCase().includes(q) ||
        row.subcategory_name?.toLowerCase().includes(q)
      ) {
        matchingTypeIds.add(row.expense_type_id);
      }
    });
    return flatRows.filter((row) => matchingTypeIds.has(row.expense_type_id));
  }, [flatRows, search]);

  // ─── Type form ────────────────────────────────────────────────

  const openTypeForm = (type?: ExpenseType) => {
    setEditingType(type || null);
    setTypeName(type?.name || "");
    setHasSubcategory(type?.has_subcategory || false);
    setSubcategoryInputs([""]);
    setTypeError("");
    setTypeFormOpen(true);
  };

  const handleTypeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTypeError("");
    if (!typeName.trim()) {
      setTypeError("Name is required");
      return;
    }
    setTypeLoading(true);
    try {
      if (editingType) {
        await expenseTypeService.update(editingType.id, {
          name: typeName,
          has_subcategory: hasSubcategory,
        });
        toast.success("Expense type updated");
      } else {
        await expenseTypeService.create({
          name: typeName,
          has_subcategory: hasSubcategory,
          subcategories: subcategoryInputs.filter((s) => s.trim()),
        });
        toast.success("Expense type created");
      }
      await fetchAll();
      setTypeFormOpen(false);
    } catch (err: any) {
      setTypeError(err.response?.data?.message || "Failed to save");
    } finally {
      setTypeLoading(false);
    }
  };

  const handleDeleteType = async () => {
    if (!deletingType) return;
    setDeleteTypeLoading(true);
    setDeleteTypeError("");
    try {
      await expenseTypeService.delete(deletingType.id);
      toast.success("Expense type deleted");
      await fetchAll();
      setDeleteTypeOpen(false);
      setDeletingType(null);
    } catch (err: any) {
      setDeleteTypeError(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteTypeLoading(false);
    }
  };

  // ─── Sub form ─────────────────────────────────────────────────

  const openSubForm = (parentId: number, sub?: ExpenseSubcategory) => {
    setSubParentId(parentId);
    setEditingSub(sub || null);
    setSubName(sub?.name || "");
    setSubError("");
    setSubFormOpen(true);
  };

  const handleSubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubError("");
    if (!subName.trim()) {
      setSubError("Name is required");
      return;
    }
    setSubLoading(true);
    try {
      if (editingSub) {
        await expenseTypeService.updateSubcategory(
          subParentId!,
          editingSub.id,
          subName,
        );
        toast.success("Subcategory updated");
      } else {
        await expenseTypeService.addSubcategory(subParentId!, subName);
        toast.success("Subcategory added");
      }
      await fetchAll();
      setSubFormOpen(false);
    } catch (err: any) {
      setSubError(err.response?.data?.message || "Failed to save");
    } finally {
      setSubLoading(false);
    }
  };

  const handleDeleteSub = async () => {
    if (!deletingSub || !subParentId) return;
    setDeleteSubLoading(true);
    try {
      await expenseTypeService.deleteSubcategory(subParentId, deletingSub.id);
      toast.success("Subcategory deleted");
      await fetchAll();
      setDeleteSubOpen(false);
      setDeletingSub(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleteSubLoading(false);
    }
  };

  // ─── Columns ──────────────────────────────────────────────────

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "serial",
        header: "S.No",
        cell: ({ row }) =>
          row.original.is_type_row ? (
            <span className='text-sm text-muted-foreground'>
              {types.findIndex((t) => t.id === row.original.expense_type_id) +
                1}
            </span>
          ) : null,
      }),
      columnHelper.accessor("expense_type_name", {
        header: ({ column }) => (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => column.toggleSorting()}
            className='gap-1 px-0 font-medium'
          >
            Expense Type <ArrowUpDown className='w-3.5 h-3.5' />
          </Button>
        ),
        cell: (info) =>
          info.row.original.is_type_row ? (
            <span className='font-semibold text-foreground'>
              {info.getValue()}
            </span>
          ) : (
            <span className='text-muted-foreground text-xs pl-4'>—</span>
          ),
      }),
      columnHelper.accessor("subcategory_name", {
        header: "Subcategory",
        cell: (info) =>
          info.row.original.is_type_row ? (
            info.row.original.has_subcategory ? (
              <Badge variant='secondary' className='text-xs'>
                {info.row.original.type_subcategory_count} subcategories
              </Badge>
            ) : (
              <Badge variant='outline' className='text-xs'>
                No subcategory
              </Badge>
            )
          ) : (
            <span className='font-medium text-foreground text-sm'>
              {info.getValue()}
            </span>
          ),
      }),
      columnHelper.display({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          if (row.original.is_type_row) {
            return (
              <div className='flex items-center gap-1'>
                {row.original.has_subcategory && (
                  <Button
                    variant='outline'
                    size='sm'
                    className='gap-1 h-7 text-xs'
                    onClick={() => openSubForm(row.original.expense_type_id)}
                  >
                    <Plus className='w-3 h-3' />
                    Add Sub
                  </Button>
                )}
                <Button
                  variant='ghost'
                  size='icon'
                  className='w-7 h-7'
                  onClick={() => openTypeForm(row.original.raw_type)}
                >
                  <Pencil className='w-3.5 h-3.5' />
                </Button>
                <Button
                  variant='ghost'
                  size='icon'
                  className='w-7 h-7 text-destructive hover:text-destructive'
                  onClick={() => {
                    setDeletingType(row.original.raw_type);
                    setDeleteTypeError("");
                    setDeleteTypeOpen(true);
                  }}
                >
                  <Trash2 className='w-3.5 h-3.5' />
                </Button>
              </div>
            );
          }

          return (
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='icon'
                className='w-7 h-7'
                onClick={() =>
                  openSubForm(
                    row.original.expense_type_id,
                    row.original.raw_sub!,
                  )
                }
              >
                <Pencil className='w-3.5 h-3.5' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='w-7 h-7 text-destructive hover:text-destructive'
                onClick={() => {
                  setDeletingSub(row.original.raw_sub);
                  setSubParentId(row.original.expense_type_id);
                  setDeleteSubOpen(true);
                }}
              >
                <Trash2 className='w-3.5 h-3.5' />
              </Button>
            </div>
          );
        },
      }),
    ],
    [types],
  );

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className='space-y-4 max-w-3xl'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-xl font-bold text-foreground'>
            Manage Expense Types
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Create and manage expense types and their subcategories.
          </p>
        </div>
        <Button onClick={() => openTypeForm()} className='gap-2'>
          <Plus className='w-4 h-4' />
          Add Expense Type
        </Button>
      </div>

      {/* Search */}
      <div className='relative w-full sm:max-w-xs'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
        <Input
          placeholder='Search by type or subcategory...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-9'
        />
      </div>

      {/* Stats */}
      <div className='flex gap-4'>
        <div className='text-sm text-muted-foreground'>
          Types:{" "}
          <span className='font-medium text-foreground'>{types.length}</span>
        </div>
        <div className='text-sm text-muted-foreground'>
          Total Subcategories:{" "}
          <span className='font-medium text-foreground'>
            {Object.values(expandedTypes).reduce(
              (sum, subs) => sum + subs.filter((s) => s.is_active).length,
              0,
            )}
          </span>
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className='p-0'>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className='text-center py-12 text-muted-foreground'
                  >
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-center py-16'>
                    <div className='flex flex-col items-center gap-3 text-muted-foreground'>
                      <Tags className='w-10 h-10 opacity-30' />
                      <p className='text-sm'>
                        {search ? "No results found." : "No expense types yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className={
                      row.original.is_type_row
                        ? "bg-muted/30 hover:bg-muted/50 font-medium"
                        : "hover:bg-muted/30"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className='text-xs text-muted-foreground'>
        Showing {filtered.length} rows
      </p>

      {/* Type form dialog */}
      <Dialog open={typeFormOpen} onOpenChange={setTypeFormOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>
              {editingType ? "Edit Expense Type" : "Add Expense Type"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleTypeSubmit} className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label>Expense Type Name</Label>
              <Input
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder='e.g. ELECTRICITY BILL'
                required
              />
              <p className='text-xs text-muted-foreground'>
                Saved in uppercase automatically.
              </p>
            </div>

            <div className='flex items-center gap-3'>
              <Switch
                checked={hasSubcategory}
                onCheckedChange={setHasSubcategory}
                id='has-sub'
              />
              <Label htmlFor='has-sub'>Has Subcategory</Label>
            </div>

            {/* Subcategory inputs on create */}
            {hasSubcategory && !editingType && (
              <div className='space-y-2'>
                <Label className='text-xs text-muted-foreground'>
                  Subcategories (optional)
                </Label>
                <div className='space-y-2 max-h-48 overflow-y-auto pr-1'>
                  {subcategoryInputs.map((val, i) => (
                    <div key={i} className='flex gap-2'>
                      <Input
                        value={val}
                        onChange={(e) => {
                          const updated = [...subcategoryInputs];
                          updated[i] = e.target.value;
                          setSubcategoryInputs(updated);
                        }}
                        placeholder={`Subcategory ${i + 1}`}
                      />
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='w-9 h-9 flex-shrink-0 text-muted-foreground hover:text-destructive'
                        onClick={() =>
                          setSubcategoryInputs((prev) =>
                            prev.filter((_, idx) => idx !== i),
                          )
                        }
                        disabled={subcategoryInputs.length === 1}
                      >
                        <X className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setSubcategoryInputs((prev) => [...prev, ""])}
                  className='gap-2'
                >
                  <Plus className='w-3.5 h-3.5' />
                  Add Row
                </Button>
              </div>
            )}

            {typeError && (
              <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
                {typeError}
              </p>
            )}

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setTypeFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={typeLoading}>
                {typeLoading ? "Saving..." : editingType ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Subcategory form */}
      <Dialog open={subFormOpen} onOpenChange={setSubFormOpen}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>
              {editingSub ? "Edit Subcategory" : "Add Subcategory"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubSubmit} className='space-y-4 py-2'>
            <div className='space-y-2'>
              <Label>Subcategory Name</Label>
              <Input
                value={subName}
                onChange={(e) => setSubName(e.target.value)}
                placeholder='e.g. KITCHEN'
                required
              />
            </div>
            {subError && (
              <p className='text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md'>
                {subError}
              </p>
            )}
            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => setSubFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type='submit' disabled={subLoading}>
                {subLoading ? "Saving..." : editingSub ? "Update" : "Add"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete type */}
      <DeleteConfirmDialog
        open={deleteTypeOpen}
        onClose={() => {
          setDeleteTypeOpen(false);
          setDeletingType(null);
        }}
        onConfirm={handleDeleteType}
        title='Delete Expense Type'
        description={`Delete "${deletingType?.name}"? All subcategories will also be removed.`}
        loading={deleteTypeLoading}
        error={deleteTypeError}
      />

      {/* Delete sub */}
      <DeleteConfirmDialog
        open={deleteSubOpen}
        onClose={() => {
          setDeleteSubOpen(false);
          setDeletingSub(null);
        }}
        onConfirm={handleDeleteSub}
        title='Delete Subcategory'
        description={`Delete "${deletingSub?.name}"?`}
        loading={deleteSubLoading}
      />
    </div>
  );
};
