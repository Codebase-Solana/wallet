import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";

interface ConfirmationDialogProps {
    title: string;
    isOpen: boolean;
    handleClose: (...args: any[]) => void;
    handleConfirm: () => void;
    children: React.ReactNode
}

const ConfirmationDialog = ({
  title,
  isOpen,
  handleClose,
  handleConfirm,
  children,
}: ConfirmationDialogProps) => {
  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title" className="flex float-left">
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText
          id="alert-dialog-description"
          className="text-left flex-wrap break-words"
        >
          {children}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          variant="contained"
          className="bg-zinc-600 hover:bg-zinc-800"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
