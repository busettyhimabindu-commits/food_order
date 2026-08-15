from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.user import User, SupportTicket
from app.schemas.schemas import SupportTicketCreate, SupportTicketReply, SupportTicketOut
from app.utils.auth_utils import get_current_user, require_admin

router = APIRouter(prefix="/api/support", tags=["Support"])

@router.post("/tickets", response_model=SupportTicketOut)
def create_support_ticket(ticket_in: SupportTicketCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = SupportTicket(
        user_id=current_user.id,
        order_id=ticket_in.order_id,
        message=ticket_in.message,
        status="Open"
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    t_dict = ticket.__dict__.copy()
    t_dict["user_name"] = current_user.name
    return SupportTicketOut(**t_dict)

@router.get("/tickets", response_model=List[SupportTicketOut])
def list_support_tickets(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in ["super_admin", "restaurant_admin"]:
        tickets = db.query(SupportTicket, User.name.label("user_name"))\
                    .join(User, SupportTicket.user_id == User.id)\
                    .order_by(SupportTicket.created_at.desc()).all()
    else:
        tickets = db.query(SupportTicket, User.name.label("user_name"))\
                    .join(User, SupportTicket.user_id == User.id)\
                    .filter(SupportTicket.user_id == current_user.id)\
                    .order_by(SupportTicket.created_at.desc()).all()

    output = []
    for t, u_name in tickets:
        t_dict = t.__dict__.copy()
        t_dict["user_name"] = u_name
        output.append(SupportTicketOut(**t_dict))
    return output

@router.put("/tickets/{ticket_id}/reply", response_model=SupportTicketOut)
def reply_support_ticket(ticket_id: int, reply_in: SupportTicketReply, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    ticket = db.query(SupportTicket).filter(SupportTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.admin_reply = reply_in.admin_reply
    ticket.status = reply_in.status or "Responded"
    db.commit()
    db.refresh(ticket)

    user = db.query(User).filter(User.id == ticket.user_id).first()
    t_dict = ticket.__dict__.copy()
    t_dict["user_name"] = user.name if user else "Customer"
    return SupportTicketOut(**t_dict)
