import os
import json
import logging
import uuid
import time
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger("smart_voting.database")

class MockDocumentSnapshot:
    def __init__(self, doc_id: str, data: Optional[Dict[str, Any]]):
        self.id = doc_id
        self._data = data

    @property
    def exists(self) -> bool:
        return self._data is not None

    def to_dict(self) -> Optional[Dict[str, Any]]:
        return self._data.copy() if self._data else None

class MockDocumentReference:
    def __init__(self, collection: 'MockCollectionReference', doc_id: str):
        self.collection = collection
        self.id = doc_id

    def get(self) -> MockDocumentSnapshot:
        data = self.collection.store.get(self.id)
        return MockDocumentSnapshot(self.id, data)

    def set(self, data: Dict[str, Any], merge: bool = False):
        if merge and self.id in self.collection.store:
            self.collection.store[self.id].update(data)
        else:
            self.collection.store[self.id] = data.copy()
        self.collection.save_if_needed()
        return self

    def update(self, data: Dict[str, Any]):
        if self.id not in self.collection.store:
            raise KeyError(f"Document {self.id} does not exist")
        self.collection.store[self.id].update(data)
        self.collection.save_if_needed()
        return self

    def delete(self):
        if self.id in self.collection.store:
            del self.collection.store[self.id]
            self.collection.save_if_needed()

class MockCollectionReference:
    def __init__(self, db: 'LocalFirestoreClient', name: str):
        self.db = db
        self.name = name
        if name not in db.collections:
            db.collections[name] = {}
        self.store = db.collections[name]

    def document(self, doc_id: Optional[str] = None) -> MockDocumentReference:
        if not doc_id:
            doc_id = str(uuid.uuid4())
        return MockDocumentReference(self, doc_id)

    def add(self, data: Dict[str, Any]):
        doc_id = str(uuid.uuid4())
        ref = self.document(doc_id)
        ref.set(data)
        return time.time(), ref

    def stream(self):
        snapshots = []
        for doc_id, data in list(self.store.items()):
            snapshots.append(MockDocumentSnapshot(doc_id, data))
        return iter(snapshots)

    def where(self, field: str, op: str, value: Any):
        return MockQuery(self, [(field, op, value)])

    def save_if_needed(self):
        self.db.persist_to_disk()

class MockQuery:
    def __init__(self, collection: MockCollectionReference, filters: List[tuple]):
        self.collection = collection
        self.filters = filters

    def where(self, field: str, op: str, value: Any):
        self.filters.append((field, op, value))
        return self

    def stream(self):
        results = []
        for doc_id, data in list(self.collection.store.items()):
            matches = True
            for field, op, value in self.filters:
                doc_val = data.get(field)
                if op == "==" and doc_val != value:
                    matches = False
                    break
                elif op == "!=" and doc_val == value:
                    matches = False
                    break
                elif op == ">" and not (doc_val > value):
                    matches = False
                    break
                elif op == "<" and not (doc_val < value):
                    matches = False
                    break
            if matches:
                results.append(MockDocumentSnapshot(doc_id, data))
        return iter(results)

class LocalFirestoreClient:
    """High-fidelity local Firestore provider for rapid academic development and tests."""
    def __init__(self, storage_file: str = "firestore_local.json"):
        self.collections: Dict[str, Dict[str, Any]] = {}
        self.storage_file = storage_file
        self.load_from_disk()

    def collection(self, name: str) -> MockCollectionReference:
        return MockCollectionReference(self, name)

    def load_from_disk(self):
        if os.path.exists(self.storage_file):
            try:
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    self.collections = json.load(f)
            except Exception as e:
                logger.warning(f"Could not load local firestore cache: {e}")
                self.collections = {}

    def persist_to_disk(self):
        try:
            with open(self.storage_file, "w", encoding="utf-8") as f:
                json.dump(self.collections, f, indent=2)
        except Exception as e:
            logger.warning(f"Could not persist local firestore: {e}")

_db_instance = None

def get_db():
    """Initializes and returns the Firestore client (Cloud or High-Fidelity Local)."""
    global _db_instance
    if _db_instance is not None:
        return _db_instance

    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    if cred_path and os.path.exists(cred_path):
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred, {
                    'projectId': settings.FIREBASE_PROJECT_ID
                })
            _db_instance = firestore.client()
            logger.info("Connected to Google Cloud Firestore via service account credentials.")
            return _db_instance
        except Exception as e:
            logger.error(f"Failed to connect to Cloud Firestore: {e}. Falling back to Local Firestore.")

    # Fallback to local Firestore
    logger.info("Using Local Firestore Provider (persisted to firestore_local.json)")
    _db_instance = LocalFirestoreClient(storage_file="firestore_local.json")
    return _db_instance
