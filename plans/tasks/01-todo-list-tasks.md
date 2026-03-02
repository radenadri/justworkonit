# Project 1: Todo List - Tasks

## Task 1.1: Setup Foundry Project

### Step 1: Initialize Foundry

```bash
mkdir -p projects/web3-todo-list
cd projects/web3-todo-list
forge init .
```

### Step 2: Install OpenZeppelin

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-commit
```

---

## Task 1.2: Smart Contract - Todo.sol

### Step 1: Create Contract

**Files:**
- Create: `projects/web3-todo-list/src/Todo.sol`

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TodoList {
    struct Task {
        uint256 id;
        string content;
        bool completed;
        address owner;
        uint256 createdAt;
    }

    event TaskCreated(uint256 indexed id, string content, address indexed owner);
    event TaskToggled(uint256 indexed id, bool completed, address indexed owner);

    mapping(uint256 => Task) public tasks;
    uint256 public nextTaskId;
    mapping(address => uint256[]) public userTaskIds;

    function createTask(string calldata _content) external {
        require(bytes(_content).length > 0, "Content cannot be empty");
        
        tasks[nextTaskId] = Task({
            id: nextTaskId,
            content: _content,
            completed: false,
            owner: msg.sender,
            createdAt: block.timestamp
        });
        
        userTaskIds[msg.sender].push(nextTaskId);
        
        emit TaskCreated(nextTaskId, _content, msg.sender);
        nextTaskId++;
    }

    function toggleTask(uint256 _taskId) external {
        Task storage task = tasks[_taskId];
        require(task.owner == msg.sender, "Not the task owner");
        
        task.completed = !task.completed;
        
        emit TaskToggled(_taskId, task.completed, msg.sender);
    }

    function getUserTasks(address _user) external view returns(Task[] memory) {
        uint256[] storage ids = userTaskIds[_user];
        Task[] memory result = new Task[](ids.length);
        
        for (uint256 i = 0; i < ids.length; i++) {
            result[i] = tasks[ids[i]];
        }
        
        return result;
    }
}
```

### Step 2: Write Tests

**Files:**
- Create: `projects/web3-todo-list/test/Todo.t.sol`

```solidity
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {TodoList} from "../src/Todo.sol";

contract TodoListTest is Test {
    TodoList public todoList;
    address public user1 = address(0x1);

    function setUp() public {
        todoList = new TodoList();
    }

    function test_createTask() public {
        vm.prank(user1);
        todoList.createTask("Learn Solidity");
        
        (uint256 id, string memory content, bool completed, address owner, ) = todoList.tasks(0);
        
        assertEq(id, 0);
        assertEq(content, "Learn Solidity");
        assertEq(completed, false);
        assertEq(owner, user1);
    }

    function test_toggleTask() public {
        vm.prank(user1);
        todoList.createTask("Learn Solidity");
        
        vm.prank(user1);
        todoList.toggleTask(0);
        
        (, , bool completed, , ) = todoList.tasks(0);
        assertEq(completed, true);
    }
}
```

### Step 3: Run Tests

```bash
cd projects/web3-todo-list
forge test
```

---

## Task 1.3: Frontend - Next.js

### Step 1: Setup Next.js

```bash
cd projects/web3-todo-list
npx create-next-app@latest frontend --typescript --tailwind --eslint --app
cd frontend
npm install wagmi viem @tanstack/react-query
```

### Step 2: Configure wagmi

**Files:**
- Create: `frontend/config/wagmi.ts`
- Modify: `frontend/app/layout.tsx`

### Step 3: Create Components

**Files:**
- Create: `frontend/components/TodoList.tsx`
- Create: `frontend/components/TodoItem.tsx`
- Create: `frontend/components/AddTodoForm.tsx`

### Step 4: Build & Test

```bash
cd frontend
npm run dev
```

---

## Verification Commands

| Step | Command | Expected |
|------|---------|----------|
| Init Foundry | `forge init .` | Success |
| Install Deps | `forge install OpenZeppelin` | No errors |
| Run Tests | `forge test` | All tests pass |
| Dev Server | `npm run dev` | Server starts |
