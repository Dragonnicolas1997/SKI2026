from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    pseudo = Column(String, unique=True, index=True)
    grid_index = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

    completions = relationship("Completion", back_populates="player", cascade="all, delete-orphan")
    likes = relationship("Like", back_populates="player", cascade="all, delete-orphan")
    free_photos = relationship("FreePhoto", back_populates="player", cascade="all, delete-orphan")


class Completion(Base):
    __tablename__ = "completions"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    defi_index = Column(Integer)
    proof_type = Column(String)  # "photo" or "text"
    proof_text = Column(String, nullable=True)
    photo_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="completions")
    likes = relationship("Like", back_populates="completion", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("player_id", "defi_index", name="uq_player_defi"),
    )


class FreePhoto(Base):
    __tablename__ = "free_photos"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    caption = Column(String, nullable=True)
    photo_path = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    player = relationship("Player", back_populates="free_photos")
    likes = relationship("FreePhotoLike", back_populates="photo", cascade="all, delete-orphan")


class FreePhotoLike(Base):
    __tablename__ = "free_photo_likes"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    free_photo_id = Column(Integer, ForeignKey("free_photos.id"))

    photo = relationship("FreePhoto", back_populates="likes")

    __table_args__ = (
        UniqueConstraint("player_id", "free_photo_id", name="uq_player_free_photo_like"),
    )


class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey("players.id"))
    completion_id = Column(Integer, ForeignKey("completions.id"))

    player = relationship("Player", back_populates="likes")
    completion = relationship("Completion", back_populates="likes")

    __table_args__ = (
        UniqueConstraint("player_id", "completion_id", name="uq_player_completion_like"),
    )
