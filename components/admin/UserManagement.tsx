"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getUsers, deleteUser, updateUser, changeUserRole, isAdmin, type UserRole } from "@/lib/auth-utils"
import type { User } from "@/lib/utils"
import { AlertCircle, CheckCircle, Trash2, UserCog, Shield, ShieldAlert, UserIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

type UserManagementProps = {
  currentUser: User
}

export default function UserManagement({ currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editRole, setEditRole] = useState<UserRole>("customer")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Load users on component mount
  useEffect(() => {
    loadUsers()
  }, [])

  // Update filtered users whenever search query or users change
  useEffect(() => {
    const searchLower = searchQuery.toLowerCase().trim()
    if (!searchLower) {
      setFilteredUsers(users)
      return
    }

    const filtered = users.filter((user) => {
      const userName = (user.name || "").toLowerCase()
      const userEmail = (user.email || "").toLowerCase()
      const userRole = (user.role || "").toLowerCase()

      return userName.includes(searchLower) ||
        userEmail.includes(searchLower) ||
        userRole.includes(searchLower)
    })
    setFilteredUsers(filtered)
  }, [searchQuery, users])

  const loadUsers = async () => {
    const loadedUsers = await getUsers()
    setUsers(loadedUsers)
  }

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.id) {
      setError("You cannot delete your own account")
      setTimeout(() => setError(""), 3000)
      return
    }

    if (window.confirm("Are you sure you want to delete this user?")) {
      const success = await deleteUser(userId)

      if (success) {
        setMessage("User deleted successfully")
        await loadUsers() // Reload users
      } else {
        setError("Failed to delete user")
      }

      // Clear messages after 3 seconds
      setTimeout(() => {
        setMessage("")
        setError("")
      }, 3000)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setEditRole(user.role as UserRole)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!selectedUser) return

    // Check if trying to change own role
    if (selectedUser.id === currentUser.id && editRole !== currentUser.role) {
      setError("You cannot change your own role")
      return
    }

    try {
      console.log('handleSaveEdit called:', { selectedUser, editRole, currentUser });

      // Only update role if it changed
      if (editRole !== selectedUser.role && isAdmin(currentUser)) {
        console.log('Updating user role...');
        await changeUserRole(currentUser.id, selectedUser.id, editRole)
        setMessage("User role updated successfully")
      } else {
        setMessage("No changes made")
      }

      await loadUsers() // Reload users
      setIsEditDialogOpen(false)
    } catch (err: any) {
      console.error('Error in handleSaveEdit:', err);
      setError(err.message || "Failed to update user")
    }

    // Clear messages after 3 seconds
    setTimeout(() => {
      setMessage("")
      setError("")
    }, 3000)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" /> Admin
          </Badge>
        )
      case "customer":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <UserIcon className="h-3 w-3" /> Customer
          </Badge>
        )
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Manage user accounts in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {message && (
            <Alert className="mb-4 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Success</AlertTitle>
              <AlertDescription className="text-green-700">{message}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditUser(user)}
                      disabled={!isAdmin(currentUser)}
                    >
                      <UserCog className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(user.id)}
                      disabled={!isAdmin(currentUser) || user.id === currentUser.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No users found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>Update user role (name cannot be changed)</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={selectedUser?.name || ""} disabled />
              <p className="text-sm text-muted-foreground">User name cannot be changed</p>
            </div>

            {isAdmin(currentUser) && (
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={editRole}
                  onValueChange={(value) => setEditRole(value as UserRole)}
                  disabled={selectedUser?.id === currentUser.id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
                {selectedUser?.id === currentUser.id && (
                  <p className="text-sm text-muted-foreground mt-1">You cannot change your own role</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
