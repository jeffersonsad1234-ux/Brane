import asyncio

class MockCollection:
    def __init__(self, name):
        self.name = name
        self.data = []
    async def find_one(self, query, projection=None):
        for item in self.data:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match: return item
        return None
    async def insert_one(self, doc):
        self.data.append(doc)
        return doc
    async def update_one(self, query, update, upsert=False):
        doc = await self.find_one(query)
        if doc:
            if "$set" in update: doc.update(update["$set"])
            return doc
        elif upsert:
            new_doc = query.copy()
            if "$set" in update: new_doc.update(update["$set"])
            self.data.append(new_doc)
            return new_doc
    async def delete_one(self, query):
        doc = await self.find_one(query)
        if doc: self.data.remove(doc)
    async def delete_many(self, query):
        self.data = [item for item in self.data if not all(item.get(k) == v for k, v in query.items())]
    def find(self, query, projection=None):
        class Cursor:
            def __init__(self, data): self.data = data
            def sort(self, field, direction): 
                self.data.sort(key=lambda x: x.get(field, ""), reverse=(direction == -1))
                return self
            def skip(self, n): self.data = self.data[n:]; return self
            def limit(self, n): self.data = self.data[:n]; return self
            async def to_list(self, n): return self.data[:n]
            def __aiter__(self):
                self.iter = iter(self.data)
                return self
            async def __anext__(self):
                try: return next(self.iter)
                except StopIteration: raise StopAsyncIteration
        
        filtered = [item for item in self.data if all(item.get(k) == v for k, v in query.items())]
        return Cursor(filtered)
    async def count_documents(self, query):
        return len([item for item in self.data if all(item.get(k) == v for k, v in query.items())])

class MockDB:
    def __init__(self):
        self.collections = {}
    def __getitem__(self, name):
        if name not in self.collections: self.collections[name] = MockCollection(name)
        return self.collections[name]

async def test():
    db = MockDB()
    await db['users'].insert_one({"email": "test@test.com", "name": "Test"})
    user = await db['users'].find_one({"email": "test@test.com"})
    print(f"User found: {user}")
    
    posts = await db['posts'].find({}).to_list(10)
    print(f"Posts: {posts}")

if __name__ == "__main__":
    asyncio.run(test())
