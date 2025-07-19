import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type PortfolioItem } from "@/lib/portfolio-data";

interface PortfolioModalProps {
  item: PortfolioItem;
  onClose: () => void;
}

export default function PortfolioModal({ item, onClose }: PortfolioModalProps) {
  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{item.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <img 
            src={item.image} 
            alt={item.title} 
            className="w-full rounded-lg"
          />
          <p className="text-gray-600 leading-relaxed">{item.description}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
